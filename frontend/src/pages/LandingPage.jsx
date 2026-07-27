import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, BarChart3, Sliders, ShieldAlert, Sparkles, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import ShapeGrid from '../components/ShapeGrid';
import TiltedCard from '../components/TiltedCard';
import SplitText from '../components/SplitText';

export default function LandingPage() {
  const navigate = useNavigate();

  // MutationObserver to listen to light-theme toggle on root documentElement
  const [isLight, setIsLight] = useState(() => 
    document.documentElement.classList.contains('light-theme')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light-theme'));
    });
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    return () => observer.disconnect();
  }, []);

  const cardsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.12, 
        delayChildren: 0.7 
      }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 25, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { 
        type: 'spring', 
        damping: 18, 
        stiffness: 120 
      }
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 70px)',
      maxHeight: 'calc(100vh - 70px)',
      height: 'calc(100vh - 70px)',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'hidden',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      {/* Background Interactive Shape Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'auto'
      }}>
        <ShapeGrid 
          speed={0.3} 
          squareSize={40}
          direction="diagonal"
          borderColor={isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.15)'}
          hoverFillColor={isLight ? 'rgba(14, 165, 233, 0.12)' : 'rgba(0, 255, 136, 0.2)'}
          shape="square"
          hoverTrailAmount={6}
        />
      </div>

      {/* Hero Section Container */}
      <div style={{
        position: 'relative',
        maxWidth: '950px',
        textAlign: 'center',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        pointerEvents: 'none'
      }}>
        {/* Glow Header Icon using Lucide Leaf */}
        <div style={{
          background: 'var(--accent-glow)',
          border: '1px solid var(--border-glow)',
          borderRadius: '50%',
          width: '70px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px var(--accent-glow)',
          animation: 'float 4s ease-in-out infinite',
          pointerEvents: 'auto',
          transition: 'all 0.3s ease'
        }}>
          <Leaf size={30} color="var(--accent-color)" style={{ transform: 'rotate(-15deg)', transition: 'color 0.3s ease' }} />
        </div>

        {/* Heading Title (Vivid Theme Accent with glowing drop-shadow) */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 800,
          color: 'var(--accent-color)',
          textShadow: '0 0 25px var(--accent-glow)',
          lineHeight: '1.1',
          margin: 0,
          letterSpacing: '-0.02em',
          transition: 'color 0.3s ease, text-shadow 0.3s ease'
        }}>
          <SplitText text="SmartAQI" stagger={0.06} />
        </h1>

        <p style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          fontWeight: 400,
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          <SplitText 
            text="An elegant, AI-powered air quality forecast engine. Monitor municipal sensor networks, detect anomalies dynamically, and generate simple, clean-air action plans."
            by="words"
            stagger={0.02}
            delay={0.4}
          />
        </p>

        {/* Action Button Grid */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '5px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'var(--accent-gradient)',
              color: isLight ? '#ffffff' : '#000000',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px var(--accent-glow)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <BarChart3 size={18} />
            View Air Dashboard
          </button>

          <button 
            onClick={() => navigate('/simulator')}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              color: 'var(--accent-color)',
              border: '1px solid var(--border-glow)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--accent-glow)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'var(--border-glow)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Sliders size={18} />
            Sensor Simulator Lab
          </button>
        </div>

        {/* Feature Highlights Section */}
        <motion.div 
          variants={cardsContainerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            width: '100%',
            marginTop: '30px',
            pointerEvents: 'auto'
          }}
        >
          {/* Card 1: Sensor Health Checks */}
          <motion.div variants={cardItemVariants}>
            <TiltedCard
              containerWidth="100%"
              containerHeight="185px"
              imageWidth="100%"
              imageHeight="185px"
              scaleOnHover={1.03}
              rotateAmplitude={10}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div style={{
                  padding: '20px',
                  height: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  textAlign: 'left',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={28} color="var(--accent-color)" style={{ transition: 'color 0.3s ease' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-white)', margin: 0, fontFamily: '"Space Grotesk", sans-serif' }}>
                    Sensor Health Check
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    We compare each sensor's air reading with nearby devices. If a sensor reports strange values, we catch and flag it as suspect, preventing false alarms.
                  </p>
                </div>
              }
            />
          </motion.div>

          {/* Card 2: Smart Air Forecasts */}
          <motion.div variants={cardItemVariants}>
            <TiltedCard
              containerWidth="100%"
              containerHeight="185px"
              imageWidth="100%"
              imageHeight="185px"
              scaleOnHover={1.03}
              rotateAmplitude={10}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div style={{
                  padding: '20px',
                  height: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  textAlign: 'left',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={28} color="var(--accent-color)" style={{ transition: 'color 0.3s ease' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-white)', margin: 0, fontFamily: '"Space Grotesk", sans-serif' }}>
                    Smart Air Forecast
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Uses machine learning to look at current air data and local weather predictions, forecasting precisely what the air quality index will be tomorrow.
                  </p>
                </div>
              }
            />
          </motion.div>

          {/* Card 3: Dynamic Gemini AI Advice */}
          <motion.div variants={cardItemVariants}>
            <TiltedCard
              containerWidth="100%"
              containerHeight="185px"
              imageWidth="100%"
              imageHeight="185px"
              scaleOnHover={1.03}
              rotateAmplitude={10}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div style={{
                  padding: '20px',
                  height: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  textAlign: 'left',
                  justifyContent: 'center'
                }}>
                  <Cpu size={28} color="var(--accent-color)" style={{ transition: 'color 0.3s ease' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-white)', margin: 0, fontFamily: '"Space Grotesk", sans-serif' }}>
                    Gemini Action Planner
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    When high pollution levels are forecast, Google's Gemini AI automatically writes a simple municipal action plan to clean up local dust and alert citizens.
                  </p>
                </div>
              }
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
