import React, { useState } from 'react';
import { X, User, Bell, Shield, Moon, Volume2, Monitor } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'appearance'>('account');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[600px] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/3 bg-slate-900 border-r border-slate-800 p-3 space-y-1">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'account' 
                  ? 'bg-orange-500/10 text-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <User size={18} />
              <span>Account</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'notifications' 
                  ? 'bg-orange-500/10 text-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>
             <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'appearance' 
                  ? 'bg-orange-500/10 text-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Monitor size={18} />
              <span>Appearance</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-slate-900/50 p-8 overflow-y-auto custom-scrollbar">
            
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center space-x-4 mb-8">
                   <img src="https://picsum.photos/id/64/200/200" className="w-20 h-20 rounded-full border-4 border-slate-800" alt="Profile" />
                   <div>
                      <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">Change Avatar</button>
                   </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                    <input type="text" defaultValue="Alex Developer" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                    <input type="email" defaultValue="alex@fpter.com" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 focus:outline-none focus:border-orange-500" disabled />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bio</label>
                     <textarea className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 h-24 resize-none" defaultValue="Building the future with code. 🚀" />
                  </div>
                </div>
              </div>
            )}

             {/* Notification Settings */}
             {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
                       <div className="flex items-center space-x-3">
                          <Bell size={20} className="text-orange-500" />
                          <div>
                             <p className="text-white font-medium">Push Notifications</p>
                             <p className="text-xs text-slate-400">Receive notifications when you are offline</p>
                          </div>
                       </div>
                       <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                           <input type="checkbox" defaultChecked className="peer absolute w-12 h-6 opacity-0 cursor-pointer" />
                           <label className="block overflow-hidden h-6 rounded-full bg-slate-600 cursor-pointer peer-checked:bg-orange-500 transition-colors duration-200"></label>
                           <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-6"></span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
                       <div className="flex items-center space-x-3">
                          <Volume2 size={20} className="text-blue-500" />
                          <div>
                             <p className="text-white font-medium">Sound Effects</p>
                             <p className="text-xs text-slate-400">Play sounds for new messages</p>
                          </div>
                       </div>
                       <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                           <input type="checkbox" defaultChecked className="peer absolute w-12 h-6 opacity-0 cursor-pointer" />
                           <label className="block overflow-hidden h-6 rounded-full bg-slate-600 cursor-pointer peer-checked:bg-orange-500 transition-colors duration-200"></label>
                           <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-6"></span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

             {/* Appearance Settings */}
             {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800 rounded-xl border-2 border-orange-500 cursor-pointer">
                       <div className="h-20 bg-slate-900 rounded-lg mb-3 flex items-center justify-center border border-slate-700">
                          <Moon className="text-white" />
                       </div>
                       <p className="text-center text-white font-medium">Dark Mode</p>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 opacity-50 cursor-not-allowed">
                       <div className="h-20 bg-slate-200 rounded-lg mb-3 flex items-center justify-center">
                          <Moon className="text-slate-900" />
                       </div>
                       <p className="text-center text-white font-medium">Light Mode</p>
                    </div>
                 </div>
                 
                 <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Accent Color</label>
                     <div className="flex space-x-3">
                        <button className="w-10 h-10 rounded-full bg-orange-500 ring-4 ring-slate-800 ring-offset-2 ring-offset-orange-500"></button>
                        <button className="w-10 h-10 rounded-full bg-indigo-500 hover:ring-4 hover:ring-slate-800 hover:ring-offset-2 hover:ring-offset-indigo-500 transition-all"></button>
                        <button className="w-10 h-10 rounded-full bg-emerald-500 hover:ring-4 hover:ring-slate-800 hover:ring-offset-2 hover:ring-offset-emerald-500 transition-all"></button>
                        <button className="w-10 h-10 rounded-full bg-rose-500 hover:ring-4 hover:ring-slate-800 hover:ring-offset-2 hover:ring-offset-rose-500 transition-all"></button>
                     </div>
                 </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
           <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
           <button onClick={onClose} className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-orange-900/20">Save Changes</button>
        </div>
      </div>
    </div>
  );
};