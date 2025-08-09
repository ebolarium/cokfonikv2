import React from 'react';
import Lottie from 'react-lottie';
import animationData from '../assets/Loading_Animation.json'; // Lottie animasyon dosyası
import logo from '../assets/Cokfonik_Logo_Siyah.png'; // Logo import

const LoadingScreen = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#FFFFFF',
      gap: '20px' // Elementler arası boşluk
    }}>
      {/* Logo */}
      <img 
        src={logo} 
        alt="Çokfonik Logo" 
        style={{
          width: 'auto',
          height: '80px', // Logo yüksekliği
          marginBottom: '20px' // Logo ile animasyon arası boşluk
        }}
      />
      
      {/* Loading Animasyonu */}
      <Lottie 
        options={defaultOptions} 
        height={120} 
        width={120} 
        style={{
          margin: '0 auto'
        }}
      />
      
      {/* Yükleniyor Yazısı */}
      <div style={{
        fontSize: '16px',
        color: '#666',
        fontWeight: 500,
        marginTop: '10px'
      }}>
        Yükleniyor...
      </div>
    </div>
  );
};

export default LoadingScreen;
