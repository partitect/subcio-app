import React from 'react';
import Lottie from 'lottie-react';
import welcomeAnimation from '../assets/welcome-animation.json';

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
            <div className="w-64 h-64 mb-8">
                <Lottie animationData={welcomeAnimation} loop={true} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Subcio</h1>
            <p className="text-xl text-gray-400 mb-8 text-center max-w-md">
                The ultimate AI-powered subtitle generator. Let's get started creating amazing content.
            </p>
            <button
                onClick={onComplete}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-lg font-semibold transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
                Get Started
            </button>
        </div>
    );
};

export default Onboarding;
