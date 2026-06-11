import { Link } from 'react-router-dom';

export default function AllianceRules() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-6 text-white font-sans">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-amber-400 hover:text-amber-300 flex items-center gap-2 mb-4">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🤝</span>
            <h1 className="text-5xl font-bold text-blue-400">2v2 Alliance Mode Rules</h1>
          </div>
          <p className="text-xl text-slate-300">Team-Based Competitive Catan</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Overview</h2>
            <p className="text-slate-300 leading-relaxed">
              In 2v2 Alliance Mode, four players form two teams of two. Teammates coordinate their strategies,
              share resources freely, and combine their victory points. The first team to reach the target
              victory point threshold wins together. This mode emphasizes cooperation within teams while
              maintaining competitive gameplay against the opposing team.
            </p>
          </section>

          {/* Game Setup */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Game Setup</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Four players split into two teams: Team A (Players 1 & 2) vs. Team B (Players 3 & 4)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Set up the standard or expanded Catan board</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Each player places 2 settlements and 2 roads during setup (alternating teams)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">4.</span>
                <span>Teams track combined victory points</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">5.</span>
                <span>Teammates can see each other's resources and cards</span>
              </li>
            </ul>
          </section>

          {/* Simultaneous Turns */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Simultaneous Team Turns</h2>
            <div className="space-y-4 text-slate-300">
              <p className="leading-relaxed">
                To maximize engagement and reduce downtime, teammates act in parallel during their team's turn:
              </p>
              <div className="border-l-4 border-blue-500 pl-4 space-y-3">
                <div>
                  <h3 className="font-bold text-blue-400 mb-1">Dice Roll</h3>
                  <p className="text-sm">One dice roll is made for the entire team. Both teammates collect resources simultaneously.</p>
                </div>
                <div>
                  <h3 className="font-bold text-blue-400 mb-1">Parallel Actions</h3>
                  <p className="text-sm">Both teammates can build, trade, and play cards at the same time. The server validates each action as it arrives.</p>
                </div>
                <div>
                  <h3 className="font-bold text-blue-400 mb-1">Turn Completion</h3>
                  <p className="text-sm">The team's turn ends only when BOTH players click "End Turn" and set their status to READY.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Alliance Synergies */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Alliance Synergies</h2>
            <div className="space-y-4">
              <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                <h3 className="font-bold text-blue-300 mb-2">🔄 Free Resource Trading</h3>
                <p className="text-slate-300 text-sm mb-2">
                  Teammates can pass resources to each other instantly at a <strong className="text-green-400">1:1 exchange rate</strong> with zero fees.
                  This allows for optimal resource distribution and coordinated building strategies.
                </p>
                <p className="text-slate-400 text-xs italic">
                  Example: Player 1 has excess wood. They can immediately transfer 2 wood to Player 2 who needs it for a settlement.
                </p>
              </div>

              <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                <h3 className="font-bold text-blue-300 mb-2">🏘️ Shared Port Leverage</h3>
                <p className="text-slate-300 text-sm mb-2">
                  If one teammate controls a specialized port (e.g., 2:1 Ore Port), the other teammate can route
                  their trades through that port by transferring resources first.
                </p>
                <p className="text-slate-400 text-xs italic">
                  Example: Player 1 controls a 2:1 Ore Port. Player 2 can send ore to Player 1, who then trades it at the better rate.
                </p>
              </div>

              <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                <h3 className="font-bold text-blue-300 mb-2">🛤️ Connected Road Networks</h3>
                <p className="text-slate-300 text-sm mb-2">
                  Teammate roads do NOT break the continuity of each other's road networks when calculating
                  <strong className="text-amber-400"> Longest Road</strong>. Your partner's roads extend your own network.
                </p>
                <p className="text-slate-400 text-xs italic">
                  Note: Standard distance rules still apply - teammates cannot build settlements directly adjacent to each other.
                </p>
              </div>
            </div>
          </section>

          {/* Building Rules */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Building & Placement Rules</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Settlement Distance:</strong> The 2-space distance rule applies to ALL players, including teammates</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Road Connectivity:</strong> Each player must connect their new roads to their own structures or roads (or teammate's roads)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Resource Costs:</strong> Standard building costs apply (no discounts for being on a team)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Cities:</strong> Only the settlement owner can upgrade their settlement to a city</span>
              </li>
            </ul>
          </section>

          {/* Robber & Development Cards */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Robber & Development Cards</h2>
            <div className="space-y-4 text-slate-300">
              <div className="border-l-4 border-slate-600 pl-4">
                <h3 className="font-bold text-slate-300 mb-2">Robber (Rolling 7)</h3>
                <ul className="space-y-1 text-sm ml-4">
                  <li>• Players with 7+ cards discard half (teammate cannot protect you)</li>
                  <li>• Active player moves robber to any non-desert tile</li>
                  <li>• Can steal from ANY opponent (including both members of the other team)</li>
                  <li>• Cannot steal from your teammate</li>
                </ul>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-bold text-purple-300 mb-2">Development Cards</h3>
                <ul className="space-y-1 text-sm ml-4">
                  <li>• Each player has their own development card hand</li>
                  <li>• Knights count toward team's Largest Army</li>
                  <li>• Monopoly and Year of Plenty work as normal</li>
                  <li>• Road Building: can only build your own roads</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Victory Conditions */}
          <section className="bg-green-950/30 border border-green-800/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4">🏆 Victory Conditions</h2>
            <div className="space-y-3 text-slate-300">
              <p>
                <strong className="text-green-400">Victory Point Target:</strong> The first team to reach
                <strong className="text-amber-400"> 20 combined victory points</strong> wins immediately.
              </p>
              <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                <h3 className="font-bold text-blue-300 mb-2">Victory Point Sources:</h3>
                <ul className="space-y-1 text-sm ml-4">
                  <li>• Settlements: 1 VP each</li>
                  <li>• Cities: 2 VP each</li>
                  <li>• Longest Road: 2 VP (awarded to player, counts for team)</li>
                  <li>• Largest Army: 2 VP (awarded to player, counts for team)</li>
                  <li>• Victory Point Cards: 1 VP each</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Strategy Tips */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">💡 Strategy Tips</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Specialize Roles:</strong> One player focuses on cities/resources, the other on roads/expansion</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Coordinate Ports:</strong> If one teammate has a 2:1 port, route trades through them</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Block Opponents:</strong> Use your combined building power to cut off the other team</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Knights Strategy:</strong> Pool knights on one player to secure Largest Army for the team</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Longest Road:</strong> Connect your roads to create a long continuous path together</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">•</span>
                <span><strong>Communicate:</strong> Discuss plans openly - your teammate is your greatest asset</span>
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
            Play Alliance Mode
          </Link>
        </div>
      </div>
    </div>
  );
}
