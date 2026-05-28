import React, { useEffect } from 'react';
import './App.css';
import logo from './assets/resolve.png';

function App() {
  useEffect(() => {
    // Add title
    document.title = "Resolve - Take Control of Your Focus";
  }, []);

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Resolve Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            Resolve
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="#features" className="text-muted" style={{ fontWeight: 500 }}>Features</a>
            <a href="#install" className="text-muted" style={{ fontWeight: 500 }}>How to Install</a>
            <a href="#install" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Download</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="section" style={{ paddingTop: '180px', minHeight: '90vh', display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Abstract BG Glows */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--accent-soft) 0%, rgba(5,5,5,0) 70%)', zIndex: -1 }}></div>
        
        <div className="container text-center animate-fade-in">
          <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'var(--surface-alt)', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }} className="text-accent">
            ✨ Now available for Android
          </div>
          <h1 style={{ fontSize: '72px', letterSpacing: '-0.02em', marginBottom: '24px' }} className="gradient-text">
            Take Control of <br/> Your <span className="gradient-text-accent">Focus</span>
          </h1>
          <p className="text-muted delay-1" style={{ fontSize: '20px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            Break free from distractions with Lockdown Mode, connect with the community, and reclaim your digital wellbeing.
          </p>
          <div className="delay-2" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a href="#install" className="btn btn-primary" style={{ animation: 'pulse-glow 2s infinite' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download APK
            </a>
            <a href="#features" className="btn btn-outline">
              Learn More
            </a>
          </div>
          
          {/* Mockup visual */}
          <div className="delay-3 animate-float" style={{ marginTop: '80px', position: 'relative', marginInline: 'auto', width: '100%', maxWidth: '800px', height: '400px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', borderBottom: 'none', overflow: 'hidden', boxShadow: '0 -20px 40px rgba(0,0,0,0.5)' }}>
             <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-alt)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'var(--border-color)' }}></div>
                <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'var(--border-color)' }}></div>
                <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'var(--border-color)' }}></div>
             </div>
             <div style={{ display: 'flex', height: '100%' }}>
                {/* Mock sidebar */}
                <div style={{ width: '25%', borderRight: '1px solid var(--border-color)', padding: '24px' }}>
                   <div style={{ height: 20, width: '80%', background: 'var(--border-color)', borderRadius: 4, marginBottom: 24 }}></div>
                   <div style={{ height: 12, width: '100%', background: 'var(--surface-alt)', borderRadius: 4, marginBottom: 12 }}></div>
                   <div style={{ height: 12, width: '60%', background: 'var(--surface-alt)', borderRadius: 4, marginBottom: 12 }}></div>
                   <div style={{ height: 12, width: '80%', background: 'var(--surface-alt)', borderRadius: 4, marginBottom: 12 }}></div>
                </div>
                {/* Mock content */}
                <div style={{ flex: 1, padding: '40px' }}>
                   <div style={{ width: 80, height: 80, borderRadius: 40, border: '4px solid var(--accent-color)', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 24, fontWeight: 'bold' }} className="text-accent">25:00</span>
                   </div>
                   <div style={{ height: 24, width: '40%', background: 'var(--text-primary)', borderRadius: 4, margin: '0 auto 16px auto' }}></div>
                   <div style={{ height: 16, width: '60%', background: 'var(--text-muted)', borderRadius: 4, margin: '0 auto' }}></div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="section" style={{ backgroundColor: 'var(--surface-color)' }}>
        <div className="container">
          <div className="text-center animate-fade-in" style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '40px', marginBottom: '16px' }}>Designed for Productivity</h2>
            <p className="text-muted" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>Everything you need to minimize distractions and maximize your productive hours.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Feature 1 */}
            <div className="glass-card animate-fade-in delay-1">
              <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--accent-soft)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }} className="text-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Lockdown Mode</h3>
              <p className="text-muted">Set up an unskippable countdown to lock away distracting apps. Regain focus immediately with a strict environment that keeps you accountable.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-card animate-fade-in delay-2">
              <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--accent-soft)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }} className="text-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Community</h3>
              <p className="text-muted">Connect with like-minded individuals. Share your progress, join focus groups, and find the motivation to keep going.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card animate-fade-in delay-3">
              <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--accent-soft)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }} className="text-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Detailed Insights</h3>
              <p className="text-muted">Track your focus sessions and view detailed analytics on your productivity over time directly from your profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="install" className="section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'var(--accent-soft)', borderRadius: '20px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }} className="text-accent">
                Getting Started
              </div>
              <h2 style={{ fontSize: '40px', marginBottom: '24px' }}>Ready to transform your habits?</h2>
              <p className="text-muted" style={{ fontSize: '18px', marginBottom: '40px' }}>
                Resolve is currently available for Android devices via APK sideloading. Follow these simple steps to install the app.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>Download the APK</h4>
                    <p className="text-muted">Tap the button below to download the latest `app-release.apk` from our GitHub releases page.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>Allow Unknown Sources</h4>
                    <p className="text-muted">When prompted, go to Settings and toggle on "Allow from this source" to permit the installation.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>Install and Open</h4>
                    <p className="text-muted">Tap "Install" and you're ready to start your first focus session!</p>
                  </div>
                </div>
              </div>

              {/* GitHub Release URL goes here */}
              {/* Note: User should update this to their actual GitHub repo URL later */}
              <a href="https://github.com/AlexKurian77/resolve/releases/latest/download/resolve.apk" className="btn btn-primary" style={{ marginTop: '40px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Latest Release
              </a>
            </div>
            
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', background: 'linear-gradient(135deg, var(--surface-alt) 0%, var(--bg-color) 100%)' }}>
               <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
               </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section" style={{ padding: '40px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <a href="#" className="text-muted">Privacy Policy</a>
            <a href="#" className="text-muted">Terms of Service</a>
            <a href="#" className="text-muted">Contact</a>
          </div>
          <p className="text-muted" style={{ fontSize: '14px' }}>© {new Date().getFullYear()} Resolve. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
