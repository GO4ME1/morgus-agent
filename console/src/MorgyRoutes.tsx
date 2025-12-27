import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MorgyDashboard } from './components/MorgyDashboard';
import { MorgyChat } from './components/MorgyChat';
import { MorgyCreator } from './components/MorgyCreator';
import { MorgyKnowledgeBase } from './components/MorgyKnowledgeBase';
import { MorgyMarket } from './components/MorgyMarket';

/**
 * Morgy System Routes
 * 
 * Add these routes to your main App.tsx:
 * 
 * import { MorgyRoutes } from './MorgyRoutes';
 * 
 * <Routes>
 *   <Route path="/morgys/*" element={<MorgyRoutes />} />
 *   ... other routes
 * </Routes>
 */
export const MorgyRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard - List all Morgys */}
      <Route index element={<MorgyDashboard />} />
      
      {/* Create new Morgy */}
      <Route path="create" element={<MorgyCreator />} />
      
      {/* Edit Morgy */}
      <Route path=":id/edit" element={<MorgyCreator />} />
      
      {/* Chat with Morgy */}
      <Route path=":id" element={<MorgyChat />} />
      
      {/* Morgy Knowledge Base */}
      <Route path=":id/knowledge" element={<MorgyKnowledgeBase morgyId="" morgyName="" />} />
      
      {/* Marketplace */}
      <Route path="market" element={<MorgyMarket />} />
      
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/morgys" replace />} />
    </Routes>
  );
};

/**
 * Example integration in your main App.tsx:
 * 
 * import React from 'react';
 * import { BrowserRouter, Routes, Route } from 'react-router-dom';
 * import { MorgyRoutes } from './MorgyRoutes';
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <div className="min-h-screen bg-gray-50">
 *         <nav className="bg-white shadow-sm">
 *           <div className="max-w-7xl mx-auto px-4 py-4">
 *             <div className="flex items-center justify-between">
 *               <h1 className="text-2xl font-bold text-gray-900">Morgus</h1>
 *               <div className="flex gap-4">
 *                 <a href="/morgys" className="text-gray-600 hover:text-gray-900">
 *                   My Morgys
 *                 </a>
 *                 <a href="/morgys/market" className="text-gray-600 hover:text-gray-900">
 *                   Market
 *                 </a>
 *               </div>
 *             </div>
 *           </div>
 *         </nav>
 *         
 *         <main>
 *           <Routes>
 *             <Route path="/" element={<Navigate to="/morgys" replace />} />
 *             <Route path="/morgys/*" element={<MorgyRoutes />} />
 *             ... other routes
 *           </Routes>
 *         </main>
 *       </div>
 *     </BrowserRouter>
 *   );
 * }
 * 
 * export default App;
 */
