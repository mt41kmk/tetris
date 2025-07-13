import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // スコアを取得（実際にはGameコンポーネントから渡される想定）
  const score = location.state?.score || 0;
  const isNewRecord = location.state?.isNewRecord || false;
  const lines = location.state?.lines || 0;
  const level = location.state?.level || 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800 rounded-xl p-8 text-center shadow-2xl"
      >
        <h1 className="text-4xl font-bold mb-6 text-tetris-cyan">GAME OVER</h1>
        
        {isNewRecord && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <span className="inline-block bg-yellow-500 text-yellow-900 font-bold px-4 py-1 rounded-full text-sm">
              🏆 ニューレコード！
            </span>
          </motion.div>
        )}
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
            <span className="text-gray-300">スコア</span>
            <span className="text-2xl font-bold">{score.toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-400">消去ライン</div>
              <div className="text-xl font-bold">{lines}</div>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-400">レベル</div>
              <div className="text-xl font-bold">{level}</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/game')}
            className="w-full py-4 bg-tetris-cyan text-gray-900 font-bold rounded-lg hover:bg-tetris-cyan/90 transition-colors"
          >
            もう一度遊ぶ
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            タイトルに戻る
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>最高スコアを目指そう！</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Result;
