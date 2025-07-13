import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Start = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold mb-4 text-tetris-cyan">TETRIS</h1>
        <p className="text-xl text-gray-300">モバイル＆Web版</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-xs space-y-4"
      >
        <button
          onClick={() => navigate('/game')}
          className="w-full py-4 px-6 bg-tetris-cyan text-gray-900 font-bold text-lg rounded-lg hover:bg-tetris-cyan/90 transition-colors"
        >
          ゲームスタート
        </button>
        
        <div className="text-center text-gray-400 mt-8">
          <p>ハイスコア: 0</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Start;
