import { Link } from 'react-router-dom';

export default function HordeRules() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-6 text-white font-sans">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-amber-400 hover:text-amber-300 flex items-center gap-2 mb-4">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">☠️</span>
            <h1 className="text-5xl font-bold text-red-400">Horde Mode Rules</h1>
          </div>
          <p className="text-xl text-slate-300">Catan vs. The Horde - Cooperative Survival</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Overview</h2>
            <p className="text-slate-300 leading-relaxed">
              In Horde Mode, all players work together to survive against an automated enemy force called "The Horde."
              Instead of competing against each other, players must coordinate their strategies to build settlements,
              gather resources, and defend the island from being consumed by darkness.
            </p>
          </section>

          {/* Game Setup */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Game Setup</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">1.</span>
                <span>Set up the standard Catan board with hexes, vertices, and edges</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">2.</span>
                <span>Each player starts with 2 settlements and 2 roads (standard setup phase)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">3.</span>
                <span>The Threat Deck is shuffled and placed face-down (approximately 35 threat cards)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">4.</span>
                <span>Threat Tracker starts at Level 0 (max level: 10)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">5.</span>
                <span>All players are on the same team with shared visibility</span>
              </li>
            </ul>
          </section>

          {/* Turn Structure */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Turn Structure</h2>
            <div className="space-y-4 text-slate-300">
              <div className="border-l-4 border-amber-500 pl-4">
                <h3 className="font-bold text-amber-400 mb-2">1. Player Phase</h3>
                <ul className="space-y-2 ml-4">
                  <li>• Roll dice for resource production</li>
                  <li>• Collect resources from settlements and cities</li>
                  <li>• Trade with the bank or guild chest</li>
                  <li>• Build roads, settlements, cities</li>
                  <li>• Buy and play development cards</li>
                </ul>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-bold text-red-400 mb-2">2. Horde Phase (End of Turn)</h3>
                <ul className="space-y-2 ml-4">
                  <li>• Click "Execute Horde Phase" button</li>
                  <li>• Draw and reveal the top Threat Card</li>
                  <li>• Immediately execute the threat effect</li>
                  <li>• Check for loss conditions</li>
                  <li>• Pass turn to next player</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Threat Cards */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Threat Card Types</h2>
            <div className="space-y-4">
              <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4">
                <h3 className="font-bold text-red-300 mb-2">☠️ Blight Tile</h3>
                <p className="text-slate-300 text-sm">
                  A specific hex becomes blighted (marked with a skull). Blighted hexes produce zero resources
                  when their number is rolled. The tile becomes dark and unusable until the end of the game.
                </p>
              </div>
              <div className="bg-orange-950/30 border border-orange-800/50 rounded-lg p-4">
                <h3 className="font-bold text-orange-300 mb-2">⚔️ Barbarian Raid</h3>
                <p className="text-slate-300 text-sm">
                  Players with more than 7 resource cards must randomly discard resources.
                  The horde attacks settlements and forces players to lose valuable materials.
                </p>
              </div>
              <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-lg p-4">
                <h3 className="font-bold text-yellow-300 mb-2">🌾 Resource Drought</h3>
                <p className="text-slate-300 text-sm">
                  All players lose 1 random resource from their hand. A harsh drought affects
                  the entire island, reducing everyone's stockpiles.
                </p>
              </div>
              <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
                <h3 className="font-bold text-purple-300 mb-2">📈 Advance Threat</h3>
                <p className="text-slate-300 text-sm">
                  The Threat Tracker increases by 1 level. As the threat level rises,
                  the situation becomes more desperate. At level 10, humanity loses.
                </p>
              </div>
            </div>
          </section>

          {/* Guild Chest */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">The Guild Chest</h2>
            <p className="text-slate-300 mb-4">
              A shared resource pool that all players can contribute to and withdraw from:
            </p>
            <ul className="space-y-2 text-slate-300 ml-4">
              <li>• <strong className="text-amber-400">Deposit:</strong> Any player can deposit resources during their turn (1:1 rate)</li>
              <li>• <strong className="text-amber-400">Withdraw:</strong> Costs 2 resources from the chest to get 1 in hand (2:1 penalty)</li>
              <li>• <strong className="text-amber-400">Strategy:</strong> Use the chest to balance resources across the team</li>
              <li>• <strong className="text-amber-400">Visibility:</strong> All players can see the guild chest contents</li>
            </ul>
          </section>

          {/* Victory Conditions */}
          <section className="bg-green-950/30 border border-green-800/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4">🏆 Victory Conditions</h2>
            <p className="text-slate-300 mb-3">Players win together if they achieve ONE of the following:</p>
            <ul className="space-y-2 text-slate-300 ml-4">
              <li>• <strong className="text-green-400">Combined Victory Points:</strong> Reach a total of 32 victory points across all players (4-player game)</li>
              <li>• <strong className="text-green-400">Mega Monument:</strong> Collectively contribute enough resources to build a massive monument</li>
            </ul>
          </section>

          {/* Loss Conditions */}
          <section className="bg-red-950/30 border border-red-800/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">💀 Loss Conditions</h2>
            <p className="text-slate-300 mb-3">Players lose immediately if ANY of the following occur:</p>
            <ul className="space-y-2 text-slate-300 ml-4">
              <li>• <strong className="text-red-400">5+ Blighted Tiles:</strong> Too much of the island has fallen to darkness</li>
              <li>• <strong className="text-red-400">Threat Level 10:</strong> The threat tracker reaches its maximum level</li>
            </ul>
          </section>

          {/* Strategy Tips */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">💡 Strategy Tips</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span><strong>Diversify Settlements:</strong> Spread out across different tile numbers to maintain steady resource production even as tiles get blighted</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span><strong>Communicate Constantly:</strong> Share your resource counts and coordinate who builds what</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span><strong>Use the Guild Chest Wisely:</strong> Balance between personal needs and team support</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span><strong>Build Cities Early:</strong> Double resource production helps offset blighted tiles</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span><strong>Manage Threat Level:</strong> Knights and development cards can provide crucial advantages</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 mb-8 flex gap-4 justify-center">
          <Link
            to="/"
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg border border-slate-600 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/play"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
          >
            Play Horde Mode
          </Link>
        </div>
      </div>
    </div>
  );
}
