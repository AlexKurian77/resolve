from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
from functools import wraps
import time
import re # Needed for simple answer parsing
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv

load_dotenv()

# --- Firebase Initialization ---
try:
    firebase_service_account_str = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    
    if firebase_service_account_str:
        # Stringified JSON (Vercel method)
        service_account_info = json.loads(firebase_service_account_str)
        cred = credentials.Certificate(service_account_info)
    else:
        # File path method (Local development)
        firebase_key_path = os.getenv("FIREBASE_KEY_PATH", "firebase_key.json")
        cred = credentials.Certificate(firebase_key_path)

    # Check if already initialized (important for serverless environments like Vercel)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
        
    db = firestore.client()
    print("Firebase initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase: {e}. Ensure 'firebase_key.json' or 'FIREBASE_SERVICE_ACCOUNT' is correct.")
    db = None 

def load_chatbot_knowledge():
    """
    Fetches the data from Firestore, formats it, and returns it as a string 
    to be used as context for the Gemini model.
    """
    if not db:
        return "Knowledge Base: Failed to load external data (Firebase initialization failed)."
    knowledge_text = "KNOWLEDGE BASE DATA FOR CHATBOT:\n"
    COLLECTION_NAME = 'support_documents' 
    try:
        docs_ref = db.collection(COLLECTION_NAME).stream()
        for i, doc in enumerate(docs_ref, 1):
            data = doc.to_dict()
            question = data.get('question', 'N/A')
            answer = data.get('answer', 'N/A')
            knowledge_text += f"Document ID: {doc.id}\nQuestion: {question}\nAnswer: {answer}\n---\n"
        return knowledge_text.strip()
    except Exception as e:
        print(f"Error fetching data from Firestore collection '{COLLECTION_NAME}': {e}")
        return "Knowledge Base: Failed to load external data due to a database error."

KNOWLEDGE_BASE = load_chatbot_knowledge()
print(f"Loaded knowledge base (approx {len(KNOWLEDGE_BASE)} characters).")

# --- App and Generative AI Setup ---
app = Flask(__name__)
CORS(app)
# API key loaded from environment variable
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-3.5-flash")

BASE_SYSTEM_PROMPT = """
You are a compassionate mental health assistant specialized in helping people overcome porn addiction. 
Provide emotional support, motivational advice, and practical strategies.
Always respond in a non-judgemental, encouraging tone.

CRITICAL INSTRUCTION: You are STRICTLY RESTRICTED to discussing topics related to mental health, addiction recovery, self-improvement, motivation, and the usage of this app. 
If the user asks a question or brings up a topic that is outside of these boundaries (such as coding, general knowledge, trivia, politics, inappropriate content, or unrelated casual chatter), you MUST politely refuse to answer. You should gently redirect the conversation back to their recovery journey or mental well-being.

Use the provided KNOWLEDGE BASE below to answer specific questions, especially those related to 
internal resources or common resolutions. If the answer is not in the knowledge base, 
rely on your general helpful and supportive persona.

MEMORY INSTRUCTION: If you learn a new, persistent fact about the user (e.g., their name, their goals, triggers, preferences), you MUST output it at the very end of your response inside a <MEMORIES>...</MEMORIES> block. Each fact should be on a new line. For example:
<MEMORIES>
User's name is John
User struggles most on weekends
</MEMORIES>
"""


# --- PDI Assessment Data ---
PDI_QUESTIONS = [
    # Q1: Usage Patterns
    {"q": "In a typical week, how often do you watch pornography?", "section": "Usage Patterns",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "Rarely, or not every week"), ("B", "1-3 times a week"), ("C", "4-6 times a week"), ("D", "Daily, or multiple times a day")]},
    
    # Q2: Usage Patterns
    {"q": "When you do watch, how long does a typical session last?", "section": "Usage Patterns",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "Less than 15 minutes"), ("B", "15 to 45 minutes"), ("C", "About an hour"), ("D", "More than an hour")]},

    # Q3: Loss of Control & Compulsivity
    {"q": "Do you often find yourself watching porn for much longer than you originally intended?", "section": "Loss of Control & Compulsivity",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "Never"), ("B", "Sometimes"), ("C", "Often"), ("D", "Almost every time")]},

    # Q4: Loss of Control & Compulsivity
    {"q": "Have you tried to stop or cut down on watching, but found you couldn't?", "section": "Loss of Control & Compulsivity",
     "options": {"A": 1, "B": 2, "C": 3, "D": 4},
     "text": [("A", "I have never tried to stop."), ("B", "I've tried and it was manageable."), ("C", "I've tried and it was very difficult."), ("D", "I've tried multiple times and failed.")]},

    # Q5: Psychological Reliance & Triggers
    {"q": "What is the most common reason you turn to pornography?", "section": "Psychological Reliance & Triggers",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "Sexual curiosity or entertainment"), ("B", "Habit or boredom"), ("C", "To cope with stress or anxiety"), ("D", "To escape feelings of sadness, loneliness, or anger")]},

    # Q6: Psychological Reliance & Triggers
    {"q": "After watching, how do you typically feel about yourself?", "section": "Psychological Reliance & Triggers",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "Fine, or positive"), ("B", "Indifferent or empty"), ("C", "A little guilty or regretful"), ("D", "Overwhelmed with shame, anxiety, or disgust")]},

    # Q7: Negative Consequences
    {"q": "Has your pornography use negatively affected your real-life relationships, work, or studies?", "section": "Negative Consequences",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "No, I don't believe so."), ("B", "It has caused minor issues or arguments."), ("C", "It has caused significant problems (e.g., loss of focus, hiding the behavior)."), ("D", "It has directly damaged a relationship, my job, or my academic performance.")]},

    # Q8: Negative Consequences
    {"q": "Do you find yourself thinking about pornography when you should be focusing on other things (like work, conversations, or hobbies)?", "section": "Negative Consequences",
     "options": {"A": 0, "B": 1, "C": 2, "D": 3},
     "text": [("A", "Rarely or never"), ("B", "Sometimes"), ("C", "Often, it's distracting"), ("D", "Constantly, it's difficult to think about anything else")]}
]

def get_pdi_analysis(score):
    """Calculates PDI level, interpretation, and app action based on the score."""
    if 0 <= score <= 6:
        level = "Low Dependability"
        interpretation = "Your usage appears to be controlled and is likely not causing significant issues in your life. You may be here for curiosity or to build healthier habits."
        action = "The app can recommend foundational content on mindful internet use, [Goal Setting](#analytics), and channel-switching techniques. The approach can be less intensive."
    elif 7 <= score <= 13:
        level = "Moderate Dependability"
        interpretation = "Your habit is becoming more established. You may be feeling a loss of control and experiencing some negative consequences. This is a crucial stage to build awareness and new coping mechanisms."
        action = "The app should suggest a structured program, introduce CBT exercises for identifying triggers, and strongly encourage using the [Urge Log](#home) and [Community](#community) features."
    elif 14 <= score <= 20:
        level = "High Dependability"
        interpretation = "Your pornography use is likely a primary coping mechanism and is having a clear, negative impact on your life. The behavior may feel compulsive and difficult to manage on your own."
        action = "The app should immediately recommend a more intensive, structured daily plan. It should prioritize features like accountability partners, emergency [Parachute Options](#lockdown), and advanced content on neuroscience and recovery. It could also provide resources for finding a therapist."
    else: # 21-26
        level = "Severe Dependability"
        interpretation = "Your relationship with pornography is causing significant distress and disruption. The behavior is likely compulsive, and you may feel powerless to stop. Professional help is strongly recommended."
        action = "The app should present its most robust features immediately. The tone should be highly supportive but firm. Most importantly, it should prominently display resources for professional help, such as links to therapists specializing in addiction, support groups (like SAA), and mental health hotlines. The app serves as a powerful tool, but it should encourage professional guidance at this level."
    
    # Format the final analysis nicely
    analysis_text = "### 1. Your Assessment Results\n\n"
    analysis_text += f"**Total Score:** {score} points (out of 26)\n"
    analysis_text += f"**PDI Level:** {level}\n\n"
    analysis_text += "### 2. Interpretation of Your PDI Level\n\n"
    analysis_text += f"_{interpretation}_\n\n"
    analysis_text += "### 3. Recommended Next Steps (App Action)\n\n"
    analysis_text += "Here is the recommended action plan for your current level:\n"
    # Convert action string to a bulleted list based on sentences for better display
    actions_list = action.split('. ')
    actions_bulleted = "\n".join([f"* {item.strip()}" for item in actions_list if item.strip()])
    analysis_text += actions_bulleted
    
    return analysis_text


@app.route("/api/pdi/questions", methods=["GET"])
def api_pdi_questions():
    return jsonify({"questions": PDI_QUESTIONS})

@app.route("/api/pdi/analyze", methods=["POST"])
def api_pdi_analyze():
    score = request.json.get("score", 0)
    analysis = get_pdi_analysis(score)
    return jsonify({"analysis": analysis})

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "").strip()
    history = request.json.get("history", [])
    user_memories = request.json.get("memories", [])
    
    if not user_message:
        return jsonify({"response": "Please type something or select an option."})

    # --- Main Menu Options Handled by Gemini ---


    if user_message == "FEELING_URGES":
        # Specific prompt to guide the model's response for a strong urge
        llm_prompt = "The user is currently feeling strong urges and needs immediate coping strategies and high motivation. Respond immediately with 2-3 actionable steps and a powerful, non-judgemental message of support."
        
    elif user_message == "SHARE_PROGRESS":
        # Specific prompt to guide the model's response for sharing progress
        llm_prompt = "The user wants to share their thoughts or progress. Respond with an encouraging and open-ended question to help them reflect and feel heard, such as 'That's fantastic. What are you most proud of in the last day or week?'"
        
    else:
        # Regular chatbot flow
        llm_prompt = f"User Query: {user_message}\nAssistant Response:"


    # --- Generic LLM Response Flow ---
    history_text = ""
    if history:
        history_text = "--- RECENT CHAT HISTORY ---\n"
        for msg in history:
            role = msg.get("role", "User")
            content = msg.get("content", "")
            if content:
                history_text += f"{role}: {content}\n"
        history_text += "--- END CHAT HISTORY ---\n\n"

    memory_text = ""
    if user_memories:
        memory_text = "--- USER MEMORIES (FACTS YOU ALREADY KNOW) ---\n"
        for mem in user_memories:
            memory_text += f"- {mem}\n"
        memory_text += "--- END USER MEMORIES ---\n\n"

    full_prompt_context = f"{BASE_SYSTEM_PROMPT}\n\n{memory_text}--- KNOWLEDGE BASE START ---\n{KNOWLEDGE_BASE}\n--- KNOWLEDGE BASE END ---\n\n{history_text}"
    final_prompt = f"{full_prompt_context}{llm_prompt}"

    new_memories = []
    try:
        # Simple retry logic for the API call 
        max_attempts = 3
        bot_reply = "⚠️ No response received from the AI model."
        for attempt in range(max_attempts):
            try:
                response = model.generate_content(final_prompt)
                bot_reply = response.text if response.text else "⚠️ No response received from the AI model."
                
                # Extract memories
                memory_match = re.search(r"<MEMORIES>(.*?)</MEMORIES>", bot_reply, re.DOTALL)
                if memory_match:
                    memory_block = memory_match.group(1).strip()
                    new_memories = [m.strip() for m in memory_block.split('\n') if m.strip()]
                    bot_reply = re.sub(r"<MEMORIES>.*?</MEMORIES>", "", bot_reply, flags=re.DOTALL).strip()
                    
                break # Success
            except Exception as e:
                print(f"Attempt {attempt + 1} failed for LLM call: {e}")
                time.sleep(1 + attempt * 2) # Exponential backoff
        
    except Exception as e:
        bot_reply = f"I encountered a severe error while processing your request. ({str(e)})"

    return jsonify({"response": bot_reply, "newMemories": new_memories})


# --- Community APIs ---

@app.route("/api/community/threads/upvote", methods=["POST"])
def upvote_post():
    data = request.json
    thread_id = data.get("threadId")
    post_id = data.get("postId")
    user_id = data.get("userId")
    
    if not db or not thread_id or not post_id or not user_id:
        return jsonify({"error": "Missing parameters or DB not initialized"}), 400
        
    try:
        thread_ref = db.collection('threads').document(thread_id)
        doc = thread_ref.get()
        if doc.exists:
            thread_data = doc.to_dict()
            updated_posts = []
            for p in thread_data.get('posts', []):
                if p.get('id') == post_id:
                    upvoted_by = p.get('upvotedBy', [])
                    if user_id in upvoted_by:
                        upvoted_by.remove(user_id)
                    else:
                        upvoted_by.append(user_id)
                    p['upvotedBy'] = upvoted_by
                    p['upvotes'] = len(upvoted_by) # Maintain backward compatibility for upvotes field
                updated_posts.append(p)
            thread_ref.update({'posts': updated_posts})
            return jsonify({"success": True})
        return jsonify({"error": "Thread not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/community/threads/post", methods=["POST"])
def add_post():
    data = request.json
    thread_id = data.get("threadId")
    new_post = data.get("post") # dict containing id, text, upvotes, replies, userId
    
    if not db or not thread_id or not new_post:
        return jsonify({"error": "Missing parameters or DB not initialized"}), 400
        
    try:
        new_post['createdAt'] = int(time.time() * 1000)
        thread_ref = db.collection('threads').document(thread_id)
        thread_ref.set({'posts': firestore.ArrayUnion([new_post])}, merge=True)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/community/threads/reply", methods=["POST"])
def add_reply():
    data = request.json
    thread_id = data.get("threadId")
    post_id = data.get("postId")
    reply = data.get("reply") # dict containing id, text, userId
    
    if not db or not thread_id or not post_id or not reply:
        return jsonify({"error": "Missing parameters or DB not initialized"}), 400
        
    try:
        thread_ref = db.collection('threads').document(thread_id)
        doc = thread_ref.get()
        if doc.exists:
            thread_data = doc.to_dict()
            updated_posts = []
            for p in thread_data.get('posts', []):
                if p.get('id') == post_id:
                    replies = p.get('replies', [])
                    replies.append(reply)
                    p['replies'] = replies
                updated_posts.append(p)
            thread_ref.update({'posts': updated_posts})
            return jsonify({"success": True})
        return jsonify({"error": "Thread not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/community/sessions/join", methods=["POST"])
def join_session():
    data = request.json
    session_id = data.get("sessionId")
    user_id = data.get("userId")
    
    if not db or not session_id or not user_id:
        return jsonify({"error": "Missing parameters or DB not initialized"}), 400
        
    try:
        session_ref = db.collection('sessions').document(session_id)
        session_ref.set({'participants': firestore.ArrayUnion([user_id])}, merge=True)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/community/chats/message", methods=["POST"])
def send_message():
    data = request.json
    chat_id = data.get("chatId")
    message = data.get("message") # dict containing id, text, fromMe, fromUserId, toUserId
    
    if not db or not chat_id or not message:
        return jsonify({"error": "Missing parameters or DB not initialized"}), 400
        
    try:
        message['timestamp'] = int(time.time() * 1000)
        chat_ref = db.collection('chats').document(chat_id)
        chat_ref.set({'messages': firestore.ArrayUnion([message])}, merge=True)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    # Binding to 0.0.0.0 allows devices on your local network (like your phone) to connect.
    app.run(host="0.0.0.0", port=5000, debug=False)
