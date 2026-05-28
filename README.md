# Resolve 

Resolve is a comprehensive mental health platform specifically designed to help individuals overcome pornography addiction and reclaim their digital wellbeing. 

## <img src="https://api.iconify.design/lucide/target.svg?color=%238ac108" width="24" height="24"> Purpose
The journey to recovery from addiction can be isolating and difficult. Resolve aims to provide evidence-based tools, structured accountability, and a compassionate, non-judgmental environment to help users break free from habits and build a healthier lifestyle.

## <img src="https://api.iconify.design/lucide/layers.svg?color=%238ac108" width="24" height="24"> Project Architecture
The project is split into three main components within this repository:

### 1. Mobile Application (`/resolveapp`)
The primary user interface built for Android.
* **Stack**: React Native, React Navigation, Firebase.
* **Key Features**:
  * **Lockdown Mode**: Set up an unskippable countdown to lock away distracting apps. Regain control immediately with a strict environment that enforces accountability.
  * **Community Groups**: Connect with like-minded individuals to share progress, join focus groups, and find motivation.
  * **Detailed Insights**: Track focus sessions and view detailed analytics on productivity over time.

### 2. Backend Services (`/resolve-backend`)
A standalone Python backend that powers the intelligence and assessment capabilities of the platform.
* **Stack**: Python, Flask, Google Generative AI (Gemini).
* **Key Features**:
  * **Compassionate AI Chatbot**: A non-judgmental conversational assistant powered by Gemini that provides personalized coping mechanisms and empathetic support right when users need it.
  * **PDI Assessment Engine**: Evaluates users based on the structured Pornography Dependence Inventory (PDI) to generate customized recovery strategies tailored to their scores.

### 3. Landing Website (`/resolve-website`)
A promotional landing page designed to showcase the app's features and distribute the Android APK.
* **Stack**: React, Vite, CSS (Glassmorphism).
* **Key Features**:
  * Fully responsive, modern dark-mode UI.
  * Step-by-step instructions for sideloading the Android APK.
  * Direct download links integrated with GitHub Releases.

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%238ac108" width="24" height="24"> Getting Started

To work on this project locally, you will need to start the components individually.

### Running the Mobile App
```bash
cd resolveapp
npm install
npx react-native run-android
```

### Running the Website
```bash
cd resolve-website
npm install
npm run dev
```

### Running the Backend
```bash
cd resolve-backend
pip install -r requirements.txt
python app.py
```

## <img src="https://api.iconify.design/lucide/handshake.svg?color=%238ac108" width="24" height="24"> Contributing
Feel free to open issues or submit pull requests to help improve the platform!
