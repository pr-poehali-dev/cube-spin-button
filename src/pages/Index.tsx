import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface DiceRoll {
  id: number;
  value: number;
  timestamp: Date;
}

interface Leader {
  name: string;
  score: number;
  rolls: number;
}

const Index = () => {
  const [currentValue, setCurrentValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [rollCount, setRollCount] = useState(0);
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [showMenu, setShowMenu] = useState(true);
  const [leaders] = useState<Leader[]>([
    { name: 'Игрок 1', score: 156, rolls: 32 },
    { name: 'Игрок 2', score: 142, rolls: 28 },
    { name: 'Игрок 3', score: 128, rolls: 25 },
    { name: 'Игрок 4', score: 115, rolls: 24 },
    { name: 'Игрок 5', score: 98, rolls: 20 }
  ]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.3;
  }, []);

  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    let rollInterval: NodeJS.Timeout;
    const rollDuration = 1000;
    let elapsed = 0;
    const intervalTime = 50;

    rollInterval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * 6) + 1);
      elapsed += intervalTime;

      if (elapsed >= rollDuration) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setCurrentValue(finalValue);
        setTotalScore(prev => prev + finalValue);
        setRollCount(prev => prev + 1);
        setHistory(prev => [{ id: Date.now(), value: finalValue, timestamp: new Date() }, ...prev.slice(0, 9)]);
        setIsRolling(false);
      }
    }, intervalTime);
  };

  const getDiceFace = (value: number) => {
    const dots = [];
    const positions: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };

    positions[value].forEach((pos, idx) => {
      dots.push(<div key={idx} className={`dice-dot ${pos}`} />);
    });

    return dots;
  };

  const startGame = () => {
    setShowMenu(false);
    setTotalScore(0);
    setRollCount(0);
    setHistory([]);
  };

  if (showMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-dark via-[#252a3a] to-game-dark flex items-center justify-center p-4">
        <Card className="bg-card/80 backdrop-blur-xl p-8 max-w-md w-full animate-fade-in border-primary/20">
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-primary mb-2">🎲</h1>
              <h2 className="text-4xl font-bold text-foreground">Dice Game</h2>
              <p className="text-muted-foreground">Бросай кубик и набирай очки!</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={startGame}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/50 transition-all"
              >
                <Icon name="Play" className="mr-2" size={24} />
                Играть
              </Button>
              
              <Button 
                variant="outline"
                className="w-full h-14 text-lg font-semibold border-primary/30 hover:bg-primary/10"
              >
                <Icon name="Settings" className="mr-2" size={24} />
                Настройки
              </Button>
              
              <Button 
                variant="outline"
                className="w-full h-14 text-lg font-semibold border-primary/30 hover:bg-primary/10"
              >
                <Icon name="LogOut" className="mr-2" size={24} />
                Выход
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-dark via-[#252a3a] to-game-dark p-4 md:p-8">
      <style>{`
        .dice-3d {
          width: 200px;
          height: 200px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.1s ease;
        }

        .dice-face {
          position: absolute;
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          border: 3px solid #333;
          border-radius: 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          padding: 20px;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.1);
        }

        .dice-dot {
          width: 30px;
          height: 30px;
          background: #333;
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }

        .dice-dot.top-left { grid-area: 1 / 1; }
        .dice-dot.top-right { grid-area: 1 / 3; }
        .dice-dot.middle-left { grid-area: 2 / 1; }
        .dice-dot.center { grid-area: 2 / 2; }
        .dice-dot.middle-right { grid-area: 2 / 3; }
        .dice-dot.bottom-left { grid-area: 3 / 1; }
        .dice-dot.bottom-right { grid-area: 3 / 3; }

        .rolling {
          animation: dice-roll 1s ease-in-out;
        }

        @keyframes dice-roll {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          25% { transform: rotateX(180deg) rotateY(90deg); }
          50% { transform: rotateX(360deg) rotateY(180deg); }
          75% { transform: rotateX(540deg) rotateY(270deg); }
          100% { transform: rotateX(720deg) rotateY(360deg); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => setShowMenu(true)}
            className="border-primary/30 hover:bg-primary/10"
          >
            <Icon name="Menu" className="mr-2" size={20} />
            Меню
          </Button>
          
          <div className="flex gap-4">
            <Card className="bg-card/80 backdrop-blur-xl px-6 py-3 border-primary/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Счет</p>
                <p className="text-3xl font-bold text-primary">{totalScore}</p>
              </div>
            </Card>
            
            <Card className="bg-card/80 backdrop-blur-xl px-6 py-3 border-primary/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Броски</p>
                <p className="text-3xl font-bold text-accent">{rollCount}</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-card/80 backdrop-blur-xl p-8 border-primary/20">
              <div className="flex flex-col items-center space-y-8">
                <div className="perspective-1000">
                  <div className={`dice-3d ${isRolling ? 'rolling' : ''}`}>
                    <div className="dice-face">
                      {getDiceFace(currentValue)}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={rollDice}
                  disabled={isRolling}
                  size="lg"
                  className="w-full max-w-xs h-16 text-2xl font-bold bg-primary hover:bg-primary/90 shadow-2xl hover:shadow-primary/50 transition-all disabled:opacity-50 animate-pulse-glow"
                >
                  {isRolling ? 'Крутится...' : 'Крутить! 🎲'}
                </Button>

                {rollCount > 0 && (
                  <div className="text-center animate-fade-in">
                    <p className="text-muted-foreground">Средний результат</p>
                    <p className="text-4xl font-bold text-primary">
                      {(totalScore / rollCount).toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur-xl p-6 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="History" size={24} className="text-primary" />
                <h3 className="text-2xl font-bold">История бросков</h3>
              </div>
              
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Пока нет бросков</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {history.map((roll) => (
                    <div
                      key={roll.id}
                      className="bg-secondary p-4 rounded-lg text-center animate-fade-in border border-primary/10"
                    >
                      <div className="text-3xl font-bold text-primary mb-1">{roll.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {roll.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-xl p-6 border-accent/20">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Trophy" size={24} className="text-accent" />
                <h3 className="text-2xl font-bold">Таблица лидеров</h3>
              </div>
              
              <div className="space-y-3">
                {leaders.map((leader, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-accent/10 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-accent text-accent-foreground' :
                        index === 1 ? 'bg-primary/70 text-primary-foreground' :
                        index === 2 ? 'bg-primary/50 text-primary-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{leader.name}</p>
                        <p className="text-sm text-muted-foreground">{leader.rolls} бросков</p>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-accent">{leader.score}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur-xl p-6 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="BarChart3" size={24} className="text-primary" />
                <h3 className="text-xl font-bold">Статистика</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Всего очков</span>
                  <span className="font-bold text-primary">{totalScore}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Всего бросков</span>
                  <span className="font-bold text-accent">{rollCount}</span>
                </div>
                
                {rollCount > 0 && (
                  <>
                    <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">Средний балл</span>
                      <span className="font-bold text-primary">{(totalScore / rollCount).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">Лучший бросок</span>
                      <span className="font-bold text-accent">{Math.max(...history.map(h => h.value))}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
