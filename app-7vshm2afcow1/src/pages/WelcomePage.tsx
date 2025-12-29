import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-x-hidden selection:bg-blue-200">
            {/* Abstract Background Decoration - Animated */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>
            <style>{`
                @keyframes bar-dance {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.6); }
                }
            `}</style>

            <div className="max-w-7xl w-full z-10 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Left Content - Text Section */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center md:items-start text-center md:text-left pt-10 md:pt-0">
                    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 pr-4 rounded-2xl border border-white/60 shadow-sm w-fit transition-transform hover:scale-105 duration-300 cursor-default">
                        <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-red-600 animate-spin-slow" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-red-600 tracking-tight">Edu</span>
                            <span className="text-lg font-bold text-slate-900 tracking-tight">Talks</span>
                            <span className="text-lg font-medium text-slate-500 tracking-tight ml-0.5">HR Attendance</span>
                        </div>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                            Manage Your <br className="hidden md:block" />
                            Work Life <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">
                                Seamlessly
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-medium">
                            Track attendance, manage shifts, and stay connected with your team in one unified platform.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative flex items-center justify-center gap-3 bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto overflow-hidden"
                        >
                            <span className="relative z-10">Get Started</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                    </div>


                </div>

                {/* Right Illustration - Interactive Grid */}
                {/* 3D Art Diagram */}
                <div className="relative w-full h-[400px] sm:h-[500px] flex items-center justify-center perspective-[2000px] group">
                    <div className="relative w-[300px] sm:w-[450px] aspect-[4/3] transform-style-3d rotate-y-[-5deg] rotate-x-[10deg] md:rotate-y-[-12deg] transition-transform duration-700 ease-out group-hover:rotate-y-[-2deg] group-hover:rotate-x-[5deg] animate-float-slow">

                        {/* Layer 0: Shadow */}
                        <div className="absolute inset-x-10 -bottom-20 h-40 bg-blue-600/20 blur-[50px] transform-style-3d rotate-x-[60deg] rounded-[100%] transition-opacity group-hover:opacity-70" />

                        {/* Layer 1: Base Platform Glass */}
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transform-style-3d transition-all duration-500 group-hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/30 to-white/10 rounded-[40px]" />
                        </div>

                        {/* Layer 2: Dashboard Content */}
                        <div className="absolute inset-4 sm:inset-6 bg-white rounded-[32px] shadow-2xl border border-slate-50 transform-style-3d translate-z-8 overflow-hidden flex flex-col transition-transform duration-500 group-hover:translate-z-12">
                            {/* Gloss */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/5 pointer-events-none z-50" />

                            {/* Header */}
                            <div className="h-14 sm:h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                                <div className="flex gap-2.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="w-24 h-2 bg-slate-200/60 rounded-full" />
                            </div>

                            {/* Inner Content */}
                            <div className="flex-1 p-5 sm:p-6 grid grid-cols-12 gap-4 sm:gap-6 bg-slate-50/30">
                                {/* Sidebar Mockup */}
                                <div className="col-span-3 space-y-3 pt-2">
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <div key={i} className={`h-2 w-full rounded-full ${i === 1 ? 'bg-blue-200' : 'bg-slate-200/60'}`} />
                                    ))}
                                </div>

                                {/* Main Stats Area */}
                                <div className="col-span-9 space-y-4 sm:space-y-5">
                                    <div className="flex gap-4">
                                        {/* Card 1 */}
                                        <div className="flex-1 aspect-[4/3] rounded-2xl bg-blue-50 border border-blue-100 p-3 sm:p-4 relative overflow-hidden flex flex-col justify-center items-center transition-transform hover:scale-105 duration-300 hover:shadow-lg cursor-pointer group/card1">
                                            <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover/card1:bg-blue-500/20 transition-colors" />
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 mb-2">98%</div>
                                            <div className="text-[10px] sm:text-xs font-bold text-blue-800/70">Attendance</div>
                                        </div>
                                        {/* Card 2 */}
                                        <div className="flex-1 aspect-[4/3] rounded-2xl bg-purple-50 border border-purple-100 p-3 sm:p-4 relative overflow-hidden flex flex-col justify-center items-center transition-transform hover:scale-105 duration-300 hover:shadow-lg cursor-pointer group/card2">
                                            <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover/card2:bg-purple-500/20 transition-colors" />
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/30 mb-2">12</div>
                                            <div className="text-[10px] sm:text-xs font-bold text-purple-800/70">Active Shifts</div>
                                        </div>
                                    </div>

                                    {/* Graph Area */}
                                    <div className="h-28 sm:h-32 rounded-2xl bg-white border border-slate-100 p-3 sm:p-4 shadow-sm relative group/graph overflow-hidden">
                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-500/5 to-transparent rounded-b-2xl" />
                                        <div className="flex items-end justify-between h-full pt-4 px-1 gap-2">
                                            {[35, 55, 40, 70, 50, 85, 60, 95, 75, 45].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-[2px] shadow-sm origin-bottom cursor-pointer"
                                                    style={{
                                                        height: `${h}%`,
                                                        animation: `bar-dance ${1000 + (i * 150)}ms ease-in-out infinite alternate`,
                                                        animationDelay: `${i * 100}ms`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element: User Card (Left) */}
                        <div className="absolute -left-2 sm:-left-8 top-12 sm:top-16 w-40 sm:w-48 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-white/60 transform-style-3d translate-z-20 transition-all duration-500 group-hover:translate-z-32 group-hover:-translate-x-2 animate-float-reverse">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 shadow-lg shadow-rose-500/30 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs border-2 border-white">HR</div>
                                <div>
                                    <div className="w-16 sm:w-20 h-2 bg-slate-800 rounded-full mb-1.5" />
                                    <div className="w-10 sm:w-12 h-1.5 bg-slate-300 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Floating Element: Status Badge (Right) */}
                        <div className="absolute -right-2 sm:-right-8 top-6 sm:top-10 w-32 sm:w-40 bg-white/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-white/60 transform-style-3d translate-z-24 transition-all duration-500 group-hover:translate-z-40 group-hover:translate-x-2 animate-bounce-slow">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 border-2 border-white">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div>
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">System</div>
                                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">Online</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Colorful Orbs */}
                        <div className="absolute bottom-4 right-4 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.4)] transform-style-3d translate-z-[-20px] opacity-70 mix-blend-multiply transition-transform duration-700 group-hover:translate-z-[-10px] group-hover:scale-110" />
                        <div className="absolute top-4 left-4 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full shadow-[0_20px_50px_rgba(245,158,11,0.4)] transform-style-3d translate-z-[-20px] opacity-70 mix-blend-multiply transition-transform duration-700 group-hover:translate-z-[-10px] group-hover:scale-110" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
