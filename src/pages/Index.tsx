import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { MainDashboard } from "@/components/Dashboard/MainDashboard";
import { SpeechTherapy } from "@/components/Speech/SpeechTherapy";
import { EmotionTracking } from "@/components/Emotion/EmotionTracking";
import { EmergencyAlert } from "@/components/Emergency/EmergencyAlert";

type ActiveModule = 'dashboard' | 'speech' | 'emotion' | 'emergency';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');

  const handleNavigate = (module: string) => {
    setActiveModule(module as ActiveModule);
  };

  const handleBack = () => {
    setActiveModule('dashboard');
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'speech':
        return <SpeechTherapy onBack={handleBack} />;
      case 'emotion':
        return <EmotionTracking onBack={handleBack} />;
      case 'emergency':
        return <EmergencyAlert onBack={handleBack} />;
      default:
        return <MainDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {activeModule === 'dashboard' && <Header />}
      {renderActiveModule()}
    </div>
  );
};

export default Index;
