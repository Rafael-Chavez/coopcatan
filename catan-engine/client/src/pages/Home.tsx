import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-white font-sans">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            CoopCatan
          </h1>
          <p className="text-xl text-slate-300">
            Cooperative & Alliance Settlers of Catan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Horde Mode Card */}
          <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-800/50 rounded-2xl p-8 hover:border-red-600/70 transition-all duration-300 shadow-2xl hover:shadow-red-900/20">
            <div className="text-4xl mb-4 text-center">☠️</div>
            <h2 className="text-3xl font-bold mb-4 text-center text-red-400">Horde Mode</h2>
            <p className="text-slate-300 mb-6 text-center">
              Survive against the relentless horde. Build together, defend your settlements, and prevent the island from falling into darkness.
            </p>
            <ul className="space-y-2 mb-6 text-slate-400">
              <li>• Cooperative gameplay - all players vs. the horde</li>
              <li>• Defend against blight, raids, and droughts</li>
              <li>• Shared victory conditions</li>
              <li>• Dynamic threat escalation</li>
            </ul>
            <div className="flex gap-3">
              <Link
                to="/rules/horde"
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-3 px-6 rounded-lg border border-red-600/50 text-center transition-colors"
              >
                View Rules
              </Link>
            </div>
          </div>

          {/* 2v2 Alliance Mode Card */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-800/50 rounded-2xl p-8 hover:border-blue-600/70 transition-all duration-300 shadow-2xl hover:shadow-blue-900/20">
            <div className="text-4xl mb-4 text-center">🤝</div>
            <h2 className="text-3xl font-bold mb-4 text-center text-blue-400">2v2 Alliance Mode</h2>
            <p className="text-slate-300 mb-6 text-center">
              Team up with a partner in this competitive alliance mode. Coordinate strategies and outbuild your opponents.
            </p>
            <ul className="space-y-2 mb-6 text-slate-400">
              <li>• Two teams of two players compete</li>
              <li>• Simultaneous turns for teammates</li>
              <li>• Share ports and trade freely</li>
              <li>• Combined victory points</li>
            </ul>
            <div className="flex gap-3">
              <Link
                to="/rules/alliance"
                className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold py-3 px-6 rounded-lg border border-blue-600/50 text-center transition-colors"
              >
                View Rules
              </Link>
            </div>
          </div>
        </div>

        {/* Play Button */}
        <div className="text-center">
          <Link
            to="/play"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-2xl hover:shadow-amber-900/50 transition-all duration-300 transform hover:scale-105"
          >
            Play Now
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>A cooperative and alliance twist on the classic Settlers of Catan</p>
        </div>
      </div>
    </div>
  );
}
