import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function IndoorCricketScorekeeper() {
  // CORE MATCH STATE
  const [innings, setInnings] = useState(1);
  const [firstInningsSummary, setFirstInningsSummary] = useState(null);
  const [target, setTarget] = useState(null);
  const [maxBalls, setMaxBalls] = useState(null);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [oversLimit, setOversLimit] = useState(6);
  const [showOverComplete, setShowOverComplete] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [lastBalls, setLastBalls] = useState([]);

  // BATTERS
  const [battingCard, setBattingCard] = useState([]);
  const [battingHistory, setBattingHistory] = useState([]);
  const [onStrikeIndex, setOnStrikeIndex] = useState(null);
  const [nonStrikeIndex, setNonStrikeIndex] = useState(null);
  const [pendingOutIndex, setPendingOutIndex] = useState(null);
  const [newBatterName, setNewBatterName] = useState("");

  // BOWLING
  const [currentBowler, setCurrentBowler] = useState("");
  const [bowlingCard, setBowlingCard] = useState({});

  // MODALS / FLOW CONTROL
  // END INNINGS SUMMARY
  const [showEndGameSummary, setShowEndGameSummary] = useState(false);
  const [secondInningsSummary, setSecondInningsSummary] = useState(null);
  const [matchResultText, setMatchResultText] = useState("");
  const [showEndInningsSummary, setShowEndInningsSummary] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [slideTimer, setSlideTimer] = useState(null);
  const [holdingEnd, setHoldingEnd] = useState(false);
  const [holdCount, setHoldCount] = useState(3);
  const [showHoldOverlay, setShowHoldOverlay] = useState(false);
  const [inningsSummary, setInningsSummary] = useState(null);

  // MODALS / FLOW CONTROL
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [showNewBowlerModal, setShowNewBowlerModal] = useState(false);
  const [showNewBatterModal, setShowNewBatterModal] = useState(false);

  const [setupStriker, setSetupStriker] = useState("");
  const [setupNonStriker, setSetupNonStriker] = useState("");
  const [setupBowler, setSetupBowler] = useState("");
  const [teamName, setTeamName] = useState("");

  const overDisplay = `${Math.floor(balls / 6)}.${balls % 6}`;

  // FINISH MATCH (2nd innings)
  const finishGame = (finalScore, finalBalls) => {
    const second = {
      teamName,
      score: finalScore,
      wickets,
      balls: finalBalls,
      batting: [...battingHistory, ...battingCard],
      bowling: bowlingCard
    };

    setSecondInningsSummary(second);

    if (finalScore >= target) {
      setMatchResultText(`${teamName} won with ${maxBalls - finalBalls} balls remaining`);
    } else {
      setMatchResultText(`${firstInningsSummary.teamName} won by ${target - finalScore - 1} runs`);
    }

    setShowEndGameSummary(true);
  };

  const addBall = () => {
    const nextBall = balls + 1;

    // end 2nd innings if balls exhausted
    if (innings === 2 && maxBalls !== null && nextBall >= maxBalls) {
      finishGame(score, nextBall);
      return;
    }

    setBalls(nextBall);

    if (nextBall % 6 === 0) {
      switchStrike();
      setShowOverComplete(true);
      setShowNewBowlerModal(true);
      setCurrentBowler("");
    }
  };

  const switchStrike = () => {
    setOnStrikeIndex(nonStrikeIndex);
    setNonStrikeIndex(onStrikeIndex);
  };

  const ensureBowler = () => {
    if (!currentBowler) return false;
    setBowlingCard(prev => ({
      ...prev,
      [currentBowler]: prev[currentBowler] || { balls: 0, runs: 0, wickets: 0, wides: 0 }
    }));
    return true;
  };

  const snapshot = () => ({ score, wickets, balls, battingCard, bowlingCard, onStrikeIndex, nonStrikeIndex, currentBowler });

  const requireModal = () => {
    if (!currentBowler) {
      setShowNewBowlerModal(true);
      return true;
    }
    if (onStrikeIndex === null) {
      setShowNewBatterModal(true);
      return true;
    }
    return false;
  };

  const dotBall = () => {
    if (requireModal()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler() || onStrikeIndex === null) return;

    setHistory(h => [...h, snapshot()]);

    setBattingCard(prev => {
      const copy = [...prev];
      const b = copy[onStrikeIndex];
      if (!b) return prev;
      copy[onStrikeIndex] = { ...b, balls: b.balls + 1 };
      return copy;
    });

    setBowlingCard(prev => {
      const copy = { ...prev };
      const bwl = copy[currentBowler];
      if (!bwl) return prev;
      copy[currentBowler] = { ...bwl, balls: bwl.balls + 1 };
      return copy;
    });

    setLastBalls(prev => ['.', ...prev.slice(0, 11)]);

    
    addBall();
  };


  const exportPDF = () => {
    // ChatGPT canvas & some embedded environments block direct window.print()
    // Workaround: open printable content in a new window and trigger print there
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Indoor Cricket Scorecard</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2, h3 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background: #f4f4f4; }
            .left { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Score: ${score}/${wickets}</h2>
          <p>Overs: ${overDisplay}</p>

          <h3>Batting</h3>
          <table>
            <thead>
              <tr><th class="left">Name</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
            </thead>
            <tbody>
              ${battingCard.map(b => `
                <tr>
                  <td class="left">${b.name}${b.out ? '' : '*'}</td>
                  <td>${b.runs}</td>
                  <td>${b.balls}</td>
                  <td>${b.fours}</td>
                  <td>${b.sixes}</td>
                  <td>${b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>Bowling</h3>
          <table>
            <thead>
              <tr><th class="left">Name</th><th>O</th><th>R</th><th>W</th><th>ECON</th><th>WD</th></tr>
            </thead>
            <tbody>
              ${Object.entries(bowlingCard).map(([name, s]) => `
                <tr>
                  <td class="left">${name}</td>
                  <td>${Math.floor(s.balls / 6)}.${s.balls % 6}</td>
                  <td>${s.runs}</td>
                  <td>${s.wickets}</td>
                  <td>${s.balls ? (s.runs / (s.balls / 6)).toFixed(2) : '0.00'}</td>
                  <td>${s.wides}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const undoLast = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setScore(last.score);
    setWickets(last.wickets);
    setBalls(last.balls);
    setBattingCard(last.battingCard);
    setBowlingCard(last.bowlingCard);
    setOnStrikeIndex(last.onStrikeIndex);
    setNonStrikeIndex(last.nonStrikeIndex);
    setCurrentBowler(last.currentBowler);
    setHistory(h => h.slice(0, -1));
  };

  const wideBall = () => {
    if (requireModal()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler()) return;
    setHistory(h => [...h, snapshot()]);

    setScore(s => s + 2);

    setBowlingCard(prev => {
      const copy = { ...prev };
      const bwl = copy[currentBowler];
      if (!bwl) return prev;
      copy[currentBowler] = { ...bwl, balls: bwl.balls + 1, runs: bwl.runs + 2, wides: bwl.wides + 1 };
      setLastBalls(prev => ['W', ...prev.slice(0, 11)]);
      return copy;
    });

    
    addBall();
  };

  const outBall = () => {
    if (requireModal()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler() || onStrikeIndex === null) return;

    setHistory(h => [...h, snapshot()]);

    // increment wicket ONCE
    setWickets(w => w + 1);
    setShowOut(true);
    setPendingOutIndex(onStrikeIndex);
    setShowNewBatterModal(true);

    setBattingCard(prev => {
      const copy = [...prev];
      const dismissed = copy[onStrikeIndex];
      if (dismissed) {
        setBattingHistory(h => [...h, { ...dismissed, out: true }]);
        copy[onStrikeIndex] = { ...dismissed, out: true };
      }
      return copy;
    });

    setBowlingCard(prev => {
      const copy = { ...prev };
      const bwl = copy[currentBowler];
      if (!bwl) return prev;
      copy[currentBowler] = { ...bwl, balls: bwl.balls + 1, wickets: bwl.wickets + 1 };
      return copy;
    });

    setLastBalls(prev => ['W', ...prev.slice(0, 11)]);

    addBall();
    setTimeout(() => setShowOut(false), 2000);
  };

  const addNewBatter = () => {
    if (!newBatterName || pendingOutIndex === null) return;

    const nb = { name: newBatterName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };

    setBattingCard(prev => {
      const copy = [...prev];
      copy[pendingOutIndex] = nb;
      return copy;
    });

    setOnStrikeIndex(pendingOutIndex);
    setPendingOutIndex(null);
    setNewBatterName("");
    setShowNewBatterModal(false);
  };

  const confirmAllOut = () => {
    setPendingOutIndex(null);
    setShowNewBatterModal(false);

    // ALL OUT LOGIC
    if (innings === 2) {
      finishGame(score, balls);
    } else {
      endInnings();
    }
  };


  const addRuns = (runs, switchStr = false) => {
    if (requireModal()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler() || onStrikeIndex === null) return;

    const nextScore = score + runs;
    const nextBalls = balls + 1;

    if (innings === 2 && target !== null && nextScore >= target) {
      finishGame(nextScore, nextBalls);
      return;
    }

    setHistory(h => [...h, snapshot()]);
    if (requireModal()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler()) return;
    if (showNewBowlerModal || showNewBatterModal) return;
    if (!ensureBowler() || onStrikeIndex === null) return;

    setHistory(h => [...h, snapshot()]);

    setScore(s => s + runs);
    setLastBalls(prev => [runs.toString(), ...prev.slice(0, 11)]);

    setBattingCard(prev => {
      const copy = [...prev];
      const b = copy[onStrikeIndex];
      if (!b) return prev;
      copy[onStrikeIndex] = {
        ...b,
        runs: b.runs + runs,
        balls: b.balls + 1,
        fours: runs === 4 ? b.fours + 1 : b.fours,
        sixes: runs === 6 ? b.sixes + 1 : b.sixes
      };
      return copy;
    });

    setBowlingCard(prev => {
      const copy = { ...prev };
      const bwl = copy[currentBowler];
      if (!bwl) return prev;
      copy[currentBowler] = { ...bwl, balls: bwl.balls + 1, runs: bwl.runs + runs };
      return copy;
    });

    
    addBall();
    if (switchStr) switchStrike();
  };

  const endInnings = () => {
    const summary = {
      teamName,
      score,
      wickets,
      balls,
      batting: [...battingHistory, ...battingCard],
      bowling: bowlingCard
    };

    if (innings === 1) {
      setFirstInningsSummary(summary);
      setTarget(score + 1);
      setMaxBalls(balls);
      setInnings(2);
      setInningsSummary(summary);
      setShowEndInningsSummary(true);
      setSlideProgress(0);
    }
  };

  const startMatch = () => {
    if (!setupStriker || !setupNonStriker || !setupBowler) return;

    if (innings === 2) {
      setMaxBalls(oversLimit * 6);
    }

    setScore(0);
    if (!setupStriker || !setupNonStriker || !setupBowler) return;

    setScore(0);
    setWickets(0);
    setBalls(0);
    setHistory([]);
    setLastBalls([]);
    setBowlingCard({});

    setBattingCard([
      { name: setupStriker, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
      { name: setupNonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
    ]);
    setBattingHistory([]);
    setOnStrikeIndex(0);
    setNonStrikeIndex(1);
    setCurrentBowler(setupBowler);
    setShowSetupModal(false);
  };

  // removed invalid render-time state updates

  useEffect(() => {
    if (!holdingEnd || slideProgress < 95) return;

    setShowHoldOverlay(true);

    const t = setTimeout(() => {
      setHoldCount(c => {
        if (c === 1) {
          if (innings === 2) {
            finishGame(score, balls);
          } else {
            endInnings();
          }
          setHoldingEnd(false);
          setShowHoldOverlay(false);
          setSlideProgress(0);
          return 3;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [holdingEnd, slideProgress, holdCount, innings, score, balls]);

  return (
    <div className={`p-6 grid gap-4 max-w-3xl mx-auto ${showEndInningsSummary ? 'overflow-hidden' : ''}`}>

      {showHoldOverlay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-white text-3xl font-bold mb-4">Hold to end innings</div>
            <div className="text-red-500 text-6xl font-extrabold">{holdCount}</div>
          </div>
        </div>
      )}

      {showEndInningsSummary && inningsSummary && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
          <Card className="w-full max-w-3xl h-[90vh] pointer-events-auto">
            <CardContent className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">End of Innings</h2>
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => {
                    setShowEndInningsSummary(false);
                    setTeamName('');
                    setSetupStriker('');
                    setSetupNonStriker('');
                    setSetupBowler('');
                    setShowSetupModal(true);
                  }}
                >
                  Start 2nd Innings
                </Button>
              </div>

              <div className="font-semibold text-lg">
                {inningsSummary.teamName} — {inningsSummary.score}/{inningsSummary.wickets} ({Math.floor(inningsSummary.balls / 6)}.{inningsSummary.balls % 6} overs)
              </div>

              <div>
                <h3 className="font-semibold mb-2">Batting</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr><th>Name</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
                  </thead>
                  <tbody>
                    {inningsSummary.batting.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td>{b.name}{b.out ? '' : '*'}</td>
                        <td className="text-center">{b.runs}</td>
                        <td className="text-center">{b.balls}</td>
                        <td className="text-center">{b.fours}</td>
                        <td className="text-center">{b.sixes}</td>
                        <td className="text-center">{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Bowling</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr><th>Name</th><th>O</th><th>R</th><th>W</th><th>ECON</th><th>WD</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(inningsSummary.bowling).map(([name, s]) => (
                      <tr key={name} className="border-t">
                        <td>{name}</td>
                        <td className="text-center">{Math.floor(s.balls / 6)}.{s.balls % 6}</td>
                        <td className="text-center">{s.runs}</td>
                        <td className="text-center">{s.wickets}</td>
                        <td className="text-center">{s.balls ? (s.runs / (s.balls / 6)).toFixed(2) : '0.00'}</td>
                        <td className="text-center">{s.wides}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEndGameSummary && firstInningsSummary && secondInningsSummary && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl h-[90vh]">
            <CardContent className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Match Result</h2>
                <Button onClick={exportPDF}>Export PDF</Button>
              </div>

              <div className="text-center text-3xl font-extrabold text-green-600">
                {matchResultText}
              </div>

              <div>
                <h3 className="font-bold text-lg mt-4">First Innings – {firstInningsSummary.teamName}</h3>
                <div className="font-semibold mb-2">
                  {firstInningsSummary.score}/{firstInningsSummary.wickets} ({Math.floor(firstInningsSummary.balls / 6)}.{firstInningsSummary.balls % 6} overs)
                </div>

                <h4 className="font-semibold">Batting</h4>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr><th>Name</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
                  </thead>
                  <tbody>
                    {firstInningsSummary.batting.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td>{b.name}{b.out ? '' : '*'}</td>
                        <td className="text-center">{b.runs}</td>
                        <td className="text-center">{b.balls}</td>
                        <td className="text-center">{b.fours}</td>
                        <td className="text-center">{b.sixes}</td>
                        <td className="text-center">{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 className="font-semibold">Bowling</h4>
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr><th>Name</th><th>O</th><th>R</th><th>W</th><th>ECON</th><th>WD</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(firstInningsSummary.bowling).map(([name, s]) => (
                      <tr key={name} className="border-t">
                        <td>{name}</td>
                        <td className="text-center">{Math.floor(s.balls / 6)}.{s.balls % 6}</td>
                        <td className="text-center">{s.runs}</td>
                        <td className="text-center">{s.wickets}</td>
                        <td className="text-center">{s.balls ? (s.runs / (s.balls / 6)).toFixed(2) : '0.00'}</td>
                        <td className="text-center">{s.wides}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold text-lg mt-6">Second Innings – {secondInningsSummary.teamName}</h3>
                <div className="font-semibold mb-2">
                  {secondInningsSummary.score}/{secondInningsSummary.wickets} ({Math.floor(secondInningsSummary.balls / 6)}.{secondInningsSummary.balls % 6} overs)
                </div>

                <h4 className="font-semibold">Batting</h4>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr><th>Name</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
                  </thead>
                  <tbody>
                    {secondInningsSummary.batting.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td>{b.name}{b.out ? '' : '*'}</td>
                        <td className="text-center">{b.runs}</td>
                        <td className="text-center">{b.balls}</td>
                        <td className="text-center">{b.fours}</td>
                        <td className="text-center">{b.sixes}</td>
                        <td className="text-center">{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 className="font-semibold">Bowling</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr><th>Name</th><th>O</th><th>R</th><th>W</th><th>ECON</th><th>WD</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(secondInningsSummary.bowling).map(([name, s]) => (
                      <tr key={name} className="border-t">
                        <td>{name}</td>
                        <td className="text-center">{Math.floor(s.balls / 6)}.{s.balls % 6}</td>
                        <td className="text-center">{s.runs}</td>
                        <td className="text-center">{s.wickets}</td>
                        <td className="text-center">{s.balls ? (s.runs / (s.balls / 6)).toFixed(2) : '0.00'}</td>
                        <td className="text-center">{s.wides}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={() => setShowEndGameSummary(false)} className="mt-4">Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4 grid gap-1">
          <div className="flex justify-between items-center">
            {innings === 2 && target !== null && maxBalls !== null && (
              <div className="text-xs text-gray-600">
                Need {Math.max(0, target - score)} runs off {Math.max(0, maxBalls - balls)} balls
              </div>
            )}
            {teamName && (
              <div className="text-sm font-bold mb-1">{teamName}</div>
            )}
            <div className="text-3xl font-bold">{score}/{wickets} <span className="text-base font-normal">({overDisplay})</span></div>
            <div className="text-right text-sm">
              {onStrikeIndex !== null && battingCard[onStrikeIndex] && (
                <div className="font-semibold">{battingCard[onStrikeIndex].name}* {battingCard[onStrikeIndex].runs}({battingCard[onStrikeIndex].balls})</div>
              )}
              {nonStrikeIndex !== null && battingCard[nonStrikeIndex] && (
                <div>{battingCard[nonStrikeIndex].name} {battingCard[nonStrikeIndex].runs}({battingCard[nonStrikeIndex].balls})</div>
              )}
              <Button
                onClick={switchStrike}
                className="mt-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300"
              >
                Switch strike
              </Button>
            </div>
          </div>
          <div className="mt-2 flex gap-2 overflow-hidden">
            {lastBalls.map((b, i) => (
              <div key={i} className={`w-8 h-8 flex items-center justify-center rounded transition-opacity ${i === lastBalls.length - 1 ? 'opacity-40' : 'opacity-100'} ${b === 'W' ? 'bg-red-500 text-white' : b === '6' ? 'bg-purple-500 text-white' : b === '4' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                {b}
              </div>
            ))}
          </div>
          {showOut && <div className="text-red-600 font-semibold">OUT</div>}
          <div className="text-sm text-gray-600">Balls remaining this over: {6 - (balls % 6)}</div>
        </CardContent>
      </Card>

      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-4 grid gap-3">
              <h3 className="font-bold text-lg">Match Setup</h3>
              <Input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
              <Input placeholder="Striker" value={setupStriker} onChange={e => setSetupStriker(e.target.value)} />
              <Input placeholder="Non-striker" value={setupNonStriker} onChange={e => setSetupNonStriker(e.target.value)} />
              <Input placeholder="Opening Bowler" value={setupBowler} onChange={e => setSetupBowler(e.target.value)} />

              {innings === 2 && (
                <div className="grid gap-1">
                  <label className="text-sm font-semibold text-gray-600">Max Overs (2nd Innings)</label>
                  <select
                    className="border rounded px-2 py-1"
                    value={oversLimit}
                    onChange={e => setOversLimit(Number(e.target.value))}
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button onClick={startMatch}>Start Match</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showNewBowlerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-4 grid gap-3">
              <h3 className="font-bold text-lg text-green-600">OVER COMPLETE</h3>
              <Input placeholder="New Bowler" value={currentBowler} onChange={e => setCurrentBowler(e.target.value)} />
              <Button onClick={() => setShowNewBowlerModal(false)}>Confirm Bowler</Button>
              <Button variant="outline" onClick={() => setShowNewBowlerModal(false)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showNewBatterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-4 grid gap-3">
              <h3 className="font-bold text-lg text-red-600">NEW BATTER</h3>
              <Input placeholder="Batter name" value={newBatterName} onChange={e => setNewBatterName(e.target.value)} />
              <Button onClick={addNewBatter}>Confirm Batter</Button>
              <Button variant="destructive" onClick={confirmAllOut}>All Out – End Innings</Button>
            </CardContent>
          </Card>
        </div>
      )}
      

      

      <Card>
        <CardContent className="p-4 grid gap-4">
          {/* DOT BALL */}
          <Button
            onClick={dotBall}
            className="h-20 text-2xl font-bold bg-black text-white hover:bg-black"
          >
            DOT BALL
          </Button>

          {/* RUNS */}
          <div className="grid grid-cols-4 gap-4">
            <Button onClick={() => addRuns(1, true)} className="h-20 text-3xl font-bold bg-green-400 text-black hover:bg-green-400">+1</Button>
            <Button onClick={() => addRuns(2, true)} className="h-20 text-3xl font-bold bg-green-400 text-black hover:bg-green-400">+2</Button>
            <Button onClick={() => addRuns(4)} className="h-20 text-3xl font-bold bg-green-400 text-black hover:bg-green-400 ">+4</Button>
            <Button onClick={() => addRuns(6)} className="h-20 text-3xl font-bold bg-green-400 text-black hover:bg-green-400">+6</Button>
          </div>

          {/* WIDE & OUT */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={wideBall} className="h-20 text-3xl font-bold bg-sky-400 text-black hover:bg-sky-400">WIDE</Button>
            <Button onClick={outBall} className="h-20 text-3xl font-bold bg-red-500 text-black hover:bg-red-500">OUT</Button>
          </div>

          <hr />

          {/* UNDO */}
          <Button
            onClick={undoLast}
            className="h-20 text-2xl font-bold bg-black text-white hover:bg-black"
          >
            UNDO
          </Button>

          <div className="mt-4">
            <div className="text-sm mb-2 font-semibold text-gray-600 text-center">Slide to end innings</div>
            <div className="relative w-full h-14 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-red-500 rounded-full"
                style={{ width: `${slideProgress}%` }}
              />
              <div
                onPointerDown={(e) => {
                  setHoldingEnd(true);
                  setHoldCount(3);
                  setShowHoldOverlay(false);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!holdingEnd) return;
                  const track = e.currentTarget.parentElement;
                  if (!track) return;
                  const rect = track.getBoundingClientRect();
                  const knobWidth = 48;
                  const x = Math.min(Math.max(0, e.clientX - rect.left - knobWidth / 2), rect.width - knobWidth);
                  const progress = (x / (rect.width - knobWidth)) * 100;
                  setSlideProgress(progress);
                }}
                onPointerUp={() => {
                  setHoldingEnd(false);
                  setSlideProgress(0);
                  setShowHoldOverlay(false);
                  setHoldCount(3);
                }}
                onPointerCancel={() => {
                  setHoldingEnd(false);
                  setSlideProgress(0);
                  setShowHoldOverlay(false);
                  setHoldCount(3);
                }}
                className="absolute top-1 left-1 h-12 w-12 bg-white rounded-full shadow flex items-center justify-center font-bold cursor-pointer select-none touch-none"
                style={{ transform: `translateX(${(slideProgress / 100) * (100 - 12)}%)` }}
              >
                ➜
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Batting</h3>
          <table className="w-full text-sm">
            <thead>
              <tr><th>Name</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
            </thead>
            <tbody>
              {[...battingHistory, ...battingCard.filter(b => !b.out)].map((b, i) => (
                <tr key={i} className="border-t">
                  <td>{b.name}{!b.out && i === onStrikeIndex ? "*" : ""}</td>
                  <td className="text-center">{b.runs}</td>
                  <td className="text-center">{b.balls}</td>
                  <td className="text-center">{b.fours}</td>
                  <td className="text-center">{b.sixes}</td>
                  <td className="text-center">{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Bowling</h3>
          <table className="w-full text-sm">
            <thead>
              <tr><th>Name</th><th>O</th><th>R</th><th>W</th><th>ECON</th><th>WD</th></tr>
            </thead>
            <tbody>
              {Object.entries(bowlingCard).map(([name, s]) => (
                <tr key={name} className="border-t">
                  <td>{name}</td>
                  <td className="text-center">{Math.floor(s.balls / 6)}.{s.balls % 6}</td>
                  <td className="text-center">{s.runs}</td>
                  <td className="text-center">{s.wickets}</td>
                  <td className="text-center">{s.balls ? (s.runs / (s.balls / 6)).toFixed(2) : "0.00"}</td>
                  <td className="text-center">{s.wides}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
