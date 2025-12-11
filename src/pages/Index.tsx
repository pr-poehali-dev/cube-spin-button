import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface Buff {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  duration: number;
  active: boolean;
  remaining: number;
}

const Index = () => {
  const [currentValue, setCurrentValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [totalScore, setTotalScore] = useState(() => {
    const saved = localStorage.getItem('diceGame_totalScore');
    return saved ? parseInt(saved) : 0;
  });
  const [rollCount, setRollCount] = useState(() => {
    const saved = localStorage.getItem('diceGame_rollCount');
    return saved ? parseInt(saved) : 0;
  });
  const [history, setHistory] = useState<DiceRoll[]>(() => {
    const saved = localStorage.getItem('diceGame_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((roll: any) => ({
        ...roll,
        timestamp: new Date(roll.timestamp)
      }));
    }
    return [];
  });
  const [showMenu, setShowMenu] = useState(true);
  const [showSaveScore, setShowSaveScore] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('diceGame_coins');
    return saved ? parseInt(saved) : 100;
  });
  const [buffs, setBuffs] = useState<Buff[]>(() => {
    const saved = localStorage.getItem('diceGame_buffs');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'luck', name: 'Удача', description: 'Увеличивает шанс на 10 до 5%', cost: 50, icon: 'Sparkles', duration: 10, active: false, remaining: 0 },
      { id: 'double', name: 'Двойной бросок', description: 'Удваивает очки за бросок', cost: 80, icon: 'Zap', duration: 5, active: false, remaining: 0 },
      { id: 'bonus', name: 'Бонус монет', description: '+2 монеты за каждый бросок', cost: 60, icon: 'Coins', duration: 15, active: false, remaining: 0 },
      { id: 'reroll', name: 'Перебросок', description: 'Можно перебросить 1 раз', cost: 30, icon: 'RotateCcw', duration: 1, active: false, remaining: 0 }
    ];
  });
  const [canReroll, setCanReroll] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>(() => {
    const saved = localStorage.getItem('diceGame_leaders');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { name: 'Игрок 1', score: 156, rolls: 32 },
      { name: 'Игрок 2', score: 142, rolls: 28 },
      { name: 'Игрок 3', score: 128, rolls: 25 },
      { name: 'Игрок 4', score: 115, rolls: 24 },
      { name: 'Игрок 5', score: 98, rolls: 20 }
    ];
  });

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.3;
  }, []);

  useEffect(() => {
    localStorage.setItem('diceGame_totalScore', totalScore.toString());
  }, [totalScore]);

  useEffect(() => {
    localStorage.setItem('diceGame_rollCount', rollCount.toString());
  }, [rollCount]);

  useEffect(() => {
    localStorage.setItem('diceGame_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('diceGame_leaders', JSON.stringify(leaders));
  }, [leaders]);

  useEffect(() => {
    localStorage.setItem('diceGame_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('diceGame_buffs', JSON.stringify(buffs));
  }, [buffs]);

  const getWeightedDiceRoll = () => {
    const luckBuff = buffs.find(b => b.id === 'luck' && b.active);
    const rand = Math.random() * 100;
    
    if (luckBuff) {
      if (rand < 5) return 10;
      return Math.floor(Math.random() * 9) + 1;
    } else {
      if (rand < 1) return 10;
      return Math.floor(Math.random() * 9) + 1;
    }
  };

  const rollDice = (isReroll = false) => {
    if (isRolling) return;
    if (isReroll && !canReroll) return;
    
    setIsRolling(true);
    if (isReroll) setCanReroll(false);
    
    let rollInterval: NodeJS.Timeout;
    const rollDuration = 1000;
    let elapsed = 0;
    const intervalTime = 50;

    rollInterval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * 10) + 1);
      elapsed += intervalTime;

      if (elapsed >= rollDuration) {
        clearInterval(rollInterval);
        const finalValue = getWeightedDiceRoll();
        setCurrentValue(finalValue);
        const doubleBuff = buffs.find(b => b.id === 'double' && b.active);
        const bonusCoinsBuff = buffs.find(b => b.id === 'bonus' && b.active);
        const rerollBuff = buffs.find(b => b.id === 'reroll' && b.active);
        
        const scoreToAdd = doubleBuff ? finalValue * 2 : finalValue;
        const coinsToAdd = 1 + (bonusCoinsBuff ? 2 : 0) + (finalValue === 10 ? 10 : 0);
        
        setTotalScore(prev => prev + scoreToAdd);
        setCoins(prev => prev + coinsToAdd);
        setRollCount(prev => prev + 1);
        setHistory(prev => [{ id: Date.now(), value: finalValue, timestamp: new Date() }, ...prev.slice(0, 9)]);
        
        if (rerollBuff && !isReroll) {
          setCanReroll(true);
        }
        
        const updatedBuffs = buffs.map(buff => {
          if (buff.active && buff.remaining > 0) {
            const newRemaining = buff.remaining - 1;
            return { ...buff, remaining: newRemaining, active: newRemaining > 0 };
          }
          return buff;
        });
        setBuffs(updatedBuffs);
        
        setIsRolling(false);
      }
    }, intervalTime);
  };

  const getDiceFace = (value: number) => {
    return (
      <div className="flex items-center justify-center h-full">
        <span className={`text-6xl font-bold ${
          value === 10 ? 'text-accent animate-pulse' : 'text-gray-900'
        }`}>
          {value}
        </span>
      </div>
    );
  };

  const startGame = () => {
    setShowMenu(false);
  };

  const resetGame = () => {
    if (totalScore > 0 && rollCount >= 5) {
      setShowSaveScore(true);
    } else {
      confirmReset();
    }
  };

  const confirmReset = () => {
    setTotalScore(0);
    setRollCount(0);
    setHistory([]);
    setCanReroll(false);
    localStorage.removeItem('diceGame_totalScore');
    localStorage.removeItem('diceGame_rollCount');
    localStorage.removeItem('diceGame_history');
    setShowSaveScore(false);
    setPlayerName('');
  };

  const buyBuff = (buffId: string) => {
    const buff = buffs.find(b => b.id === buffId);
    if (!buff || coins < buff.cost || buff.active) return;
    
    setCoins(prev => prev - buff.cost);
    const updatedBuffs = buffs.map(b => 
      b.id === buffId ? { ...b, active: true, remaining: b.duration } : b
    );
    setBuffs(updatedBuffs);
    setShowShop(false);
  };

  const saveScore = () => {
    if (!playerName.trim()) return;
    
    const newLeader: Leader = {
      name: playerName.trim(),
      score: totalScore,
      rolls: rollCount
    };
    
    const updatedLeaders = [...leaders, newLeader]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    setLeaders(updatedLeaders);
    confirmReset();
  };

  const skipSave = () => {
    confirmReset();
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

            {(totalScore > 0 || rollCount > 0) && (
              <Card className="bg-primary/10 border-primary/30 p-4">
                <p className="text-sm text-muted-foreground mb-2">Сохраненный прогресс</p>
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{totalScore}</p>
                    <p className="text-xs text-muted-foreground">Очков</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{rollCount}</p>
                    <p className="text-xs text-muted-foreground">Бросков</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{rollCount > 0 ? (totalScore / rollCount).toFixed(1) : '0'}</p>
                    <p className="text-xs text-muted-foreground">Средний</p>
                  </div>
                </div>
              </Card>
            )}
            
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

  const isInTopLeaders = totalScore > 0 && rollCount >= 5 && (leaders.length < 10 || totalScore > leaders[leaders.length - 1].score);

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
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.1);
        }

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMenu(true)}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Icon name="Menu" className="mr-2" size={20} />
              Меню
            </Button>
            
            <Button
              variant="outline"
              onClick={resetGame}
              className="border-destructive/30 hover:bg-destructive/10 text-destructive"
            >
              <Icon name="RotateCcw" className="mr-2" size={20} />
              Сброс
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Card className="bg-accent/20 backdrop-blur-xl px-6 py-3 border-accent/30">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Монеты</p>
                <p className="text-3xl font-bold text-accent flex items-center justify-center gap-1">
                  <Icon name="Coins" size={28} />
                  {coins}
                </p>
              </div>
            </Card>
          
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

                <div className="w-full max-w-xs space-y-3">
                  <Button
                    onClick={() => rollDice(false)}
                    disabled={isRolling}
                    size="lg"
                    className="w-full h-16 text-2xl font-bold bg-primary hover:bg-primary/90 shadow-2xl hover:shadow-primary/50 transition-all disabled:opacity-50 animate-pulse-glow"
                  >
                    {isRolling ? 'Крутится...' : 'Крутить! 🎲'}
                  </Button>

                  {canReroll && (
                    <Button
                      onClick={() => rollDice(true)}
                      disabled={isRolling}
                      size="lg"
                      variant="outline"
                      className="w-full h-14 text-lg font-semibold border-accent/50 hover:bg-accent/10 text-accent animate-fade-in"
                    >
                      <Icon name="RotateCcw" className="mr-2" size={20} />
                      Перебросить (доступен)
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setShowShop(true)}
                    variant="outline"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold border-accent/50 hover:bg-accent/10"
                  >
                    <Icon name="ShoppingCart" className="mr-2" size={20} />
                    Магазин бафов
                  </Button>
                </div>

                {buffs.some(b => b.active) && (
                  <div className="w-full max-w-xs space-y-2 animate-fade-in">
                    <p className="text-sm text-muted-foreground text-center">Активные бафы:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {buffs.filter(b => b.active).map(buff => (
                        <div key={buff.id} className="bg-accent/20 border border-accent/30 px-3 py-1 rounded-lg flex items-center gap-2">
                          <Icon name={buff.icon as any} size={16} className="text-accent" />
                          <span className="text-sm font-medium">{buff.name}</span>
                          <span className="text-xs text-muted-foreground">({buff.remaining})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      <Dialog open={showSaveScore} onOpenChange={setShowSaveScore}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {isInTopLeaders ? '🏆 Отличный результат!' : '🎲 Завершить игру?'}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {isInTopLeaders 
                ? 'Вы попали в топ! Сохраните свой результат в таблице лидеров.'
                : 'Хотите сохранить свой результат?'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-around text-center bg-secondary p-4 rounded-lg">
              <div>
                <p className="text-3xl font-bold text-primary">{totalScore}</p>
                <p className="text-sm text-muted-foreground">Очков</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{rollCount}</p>
                <p className="text-sm text-muted-foreground">Бросков</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{rollCount > 0 ? (totalScore / rollCount).toFixed(1) : '0'}</p>
                <p className="text-sm text-muted-foreground">Средний</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ваше имя</label>
              <Input
                placeholder="Введите имя"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && saveScore()}
                className="h-12 text-lg"
                maxLength={20}
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={skipSave}
              className="flex-1"
            >
              Пропустить
            </Button>
            <Button
              onClick={saveScore}
              disabled={!playerName.trim()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Icon name="Trophy" className="mr-2" size={20} />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShop} onOpenChange={setShowShop}>
        <DialogContent className="bg-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Icon name="ShoppingCart" size={28} />
              Магазин бафов
            </DialogTitle>
            <DialogDescription className="text-center">
              У вас: <span className="text-accent font-bold text-lg">{coins} <Icon name="Coins" className="inline" size={16} /></span> монет
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {buffs.map(buff => (
              <Card key={buff.id} className={`p-4 ${buff.active ? 'bg-accent/10 border-accent/30' : 'bg-secondary border-primary/20'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${buff.active ? 'bg-accent/20' : 'bg-primary/20'}`}>
                    <Icon name={buff.icon as any} size={24} className={buff.active ? 'text-accent' : 'text-primary'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {buff.name}
                      {buff.active && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                          Активен ({buff.remaining})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{buff.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-accent font-bold">
                    <Icon name="Coins" size={18} />
                    {buff.cost}
                  </div>
                  <Button
                    onClick={() => buyBuff(buff.id)}
                    disabled={buff.active || coins < buff.cost}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {buff.active ? 'Активен' : coins < buff.cost ? 'Мало монет' : 'Купить'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              💡 <strong>Совет:</strong> Зарабатывайте монеты за каждый бросок. За выпадение 10 получаете бонус +10 монет!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;