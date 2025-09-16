
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { History, Delete, Sigma, Divide, X, Minus, Plus, Percent, Moon, Sun, Settings } from 'lucide-react';
import { performUnitConversion } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Fraction from 'fraction.js';

type ButtonType = 'number' | 'operator' | 'clear' | 'equals' | 'delete' | 'decimal' | 'percent' | 'toggle_sign' | 'advanced_func' | 'parenthesis' | 'constant' | 'memory' | 'shift' | 'mode' | 'ans' | 'combination' | 'permutation' | 'fraction' | 'sd_toggle';
type AngleMode = 'DEG' | 'RAD';

interface CalcButton {
  value: string;
  label: React.ReactNode;
  type: ButtonType;
  className?: string;
  advanced?: boolean;
  shiftValue?: string;
  shiftLabel?: React.ReactNode;
  key: string;
}

const factorial = (n: number): number => {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0) return 1;
    let result = 1;
    for (let i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
};

const combinations = (n: number, r: number): number => {
    if (r < 0 || r > n) return NaN;
    return factorial(n) / (factorial(r) * factorial(n - r));
};

const permutations = (n: number, r: number): number => {
    if (r < 0 || r > n) return NaN;
    return factorial(n) / factorial(n - r);
};


const Calculator = () => {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isResult, setIsResult] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isHyperbolic, setIsHyperbolic] = useState(false);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [theme, setTheme] = useState('light');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [lastAnswer, setLastAnswer] = useState('0');
  const [memory, setMemory] = useState(0);
  const [fractionResult, setFractionResult] = useState<Fraction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.body.classList.add('bg-gradient-to-br', 'from-purple-50', 'via-blue-50', 'to-cyan-50', 'dark:from-gray-900', 'dark:via-blue-950', 'dark:to-gray-900');
    const storedTheme = localStorage.getItem('calculator-theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    
    return () => {
      document.body.classList.remove('bg-gradient-to-br', 'from-purple-50', 'via-blue-50', 'to-cyan-50', 'dark:from-gray-900', 'dark:via-blue-950', 'dark:to-gray-900');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('calculator-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  const toggleDisplayMode = () => {
    if (!fractionResult || display === 'Error') return;

    const isCurrentlyFraction = display.includes('/');
    if (isCurrentlyFraction) {
      setDisplay(fractionResult.valueOf().toString());
    } else {
      setDisplay(fractionResult.toFraction(true));
    }
  };


  const handleButtonPress = useCallback(async (btn: CalcButton) => {
    const currentVal = (isShiftActive && btn.shiftValue) ? btn.shiftValue : btn.value;
    const currentLabel = (isShiftActive && btn.shiftLabel) ? (btn.shiftLabel as string) : (typeof btn.label === 'string' ? btn.label : btn.value);
    const currentType = (isShiftActive && btn.shiftValue) ? (btn.type === 'combination' ? 'permutation' : btn.type) : btn.type;


    if (btn.type === 'shift') {
        setIsShiftActive(s => !s);
        return;
    }
    
    if (btn.value === 'hyp') {
        setIsHyperbolic(h => !h);
        setIsShiftActive(false);
        return;
    }
    
    if (btn.type === 'mode') return;
    
    if (btn.type === 'sd_toggle') {
        toggleDisplayMode();
        return;
    }


    switch (currentType) {
      case 'number':
      case 'decimal':
      case 'constant':
      case 'parenthesis':
      case 'ans':
      case 'fraction':
        if (isResult) {
            const valToSet = btn.type === 'ans' ? lastAnswer : currentVal;
            setExpression(valToSet);
            setDisplay(valToSet);
            setIsResult(false);
            setFractionResult(null);
        } else {
            const valToSet = btn.type === 'ans' ? lastAnswer : currentVal;
            const exprToSet = btn.type === 'ans' ? lastAnswer : currentVal;
            setExpression(prev => (prev === '0' && exprToSet !== '.') ? exprToSet : prev + exprToSet);
            setDisplay(prev => (prev === '0' && valToSet !== '.') ? valToSet : prev + valToSet);
        }
        setIsShiftActive(false);
        break;

      case 'operator':
      case 'combination':
      case 'permutation':
        if (expression === '' && !['-', '√'].includes(currentVal)) return;
        if (isResult) {
          setIsResult(false);
          setFractionResult(null);
        };
        
        const lastChar = expression.slice(-1);
        const operatorLabel = (currentVal === '×' ? '×' : currentVal === '÷' ? '÷' : currentVal);
        if (['+', '×', '÷', '-', '^', 'C', 'P'].includes(lastChar)) {
          setExpression(prev => prev.slice(0, -1) + currentVal);
          setDisplay(prev => prev.slice(0, -1) + operatorLabel);
        } else {
          setExpression(prev => prev + currentVal);
          setDisplay(prev => prev + operatorLabel);
        }
        setIsShiftActive(false);
        break;

      case 'advanced_func':
        if (isResult && !['x³', 'x²', 'x⁻¹', '!'].includes(currentVal)) {
            setExpression('');
            setDisplay('0');
            setIsResult(false);
            setFractionResult(null);
        }
        
        let func = currentVal;
        
        if (isHyperbolic && ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(func)) {
            func = func.replace('a', 'a') + 'h';
        }

        if(func.endsWith('!')) {
            setExpression(prev => prev + '!');
            setDisplay(prev => prev + '!');
        } else if (func.endsWith('³') || func.endsWith('²') || func.endsWith('⁻¹')) {
            const power = func.endsWith('³') ? '^3' : (func.endsWith('²') ? '^2' : '^-1');
            setExpression(prev => prev + power);
            setDisplay(prev => prev + (btn.label as string));
        } else {
            const funcName = func.replace('h','');
            const displayFunc = isShiftActive ? func.replace('a', 'a') : funcName;
            setExpression(prev => prev + func + '(');
            setDisplay(prev => prev === '0' ? displayFunc + '(' : prev + displayFunc + '(');
        }
        setIsResult(false);
        setIsShiftActive(false);
        break;
      
      case 'percent':
        if (expression === '') return;
        setExpression(prev => prev + '%');
        setDisplay(prev => prev + '%');
        setIsResult(false);
        setIsShiftActive(false);
        break;
      
      case 'memory':
        const currentDisplayValue = parseFloat(display);
        if(isNaN(currentDisplayValue) && currentVal !== 'mr' && currentVal !== 'mc') return;

        switch(currentVal) {
            case 'm+':
                setMemory(m => m + currentDisplayValue);
                break;
            case 'm-':
                setMemory(m => m - currentDisplayValue);
                break;
            case 'mr':
                 if (isResult) {
                    setExpression(String(memory));
                    setDisplay(String(memory));
                    setIsResult(false);
                    setFractionResult(null);
                } else {
                    setExpression(prev => prev + String(memory));
                    setDisplay(prev => prev + String(memory));
                }
                break;
            case 'mc':
                setMemory(0);
                break;
        }
        setIsShiftActive(false);
        break;


      case 'clear':
        setExpression('');
        setDisplay('0');
        setIsResult(false);
        setIsHyperbolic(false);
        setIsShiftActive(false);
        setFractionResult(null);
        break;

      case 'delete':
        if (isResult) break;
        if (expression.length > 0) {
            let newExpression = expression;
            let newDisplay = display;
            
            const funcMatch = newExpression.match(/(sin|cos|tan|log|ln|sqrt|abs|sinh|cosh|tanh|asinh|acosh|atanh|nCr|nPr)\($/);
            if (funcMatch) {
              newExpression = newExpression.slice(0, -funcMatch[0].length);
              newDisplay = newDisplay.slice(0, -funcMatch[0].length);
            } else {
              newExpression = newExpression.slice(0, -1);
              newDisplay = newDisplay.slice(0, -1);
            }

            if (newExpression.length === 0) {
                setExpression('');
                setDisplay('0');
            } else {
                setExpression(newExpression);
                setDisplay(newDisplay);
            }
        }
        break;

      case 'equals':
        if (isAiLoading || !expression) return;
        let finalExpression = expression.trim();

        if (finalExpression.includes('/') && !finalExpression.match(/[a-zA-Z]/)) {
            try {
                const result = new Fraction(finalExpression.replace(/×/g, '*').replace(/÷/g, '/'));
                const resultString = result.toFraction(true);
                setDisplay(resultString);
                setHistory(prev => [`${expression} = ${resultString}`, ...prev].slice(0, 20));
                setExpression(result.toFraction(false));
                setLastAnswer(result.valueOf().toString());
                setFractionResult(result);
            } catch(e) {
                toast({ variant: 'destructive', title: 'Fraction Error', description: 'Invalid fraction expression.' });
                setDisplay('Error');
                setExpression('');
                setFractionResult(null);
            }
        } else if (/[a-zA-Z]{2,}/.test(finalExpression) && !['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'e', 'π', 'Ans', 'C', 'P'].some(fn => finalExpression.includes(fn))) {
          setIsAiLoading(true);
          const { data, error } = await performUnitConversion(finalExpression);
          setIsAiLoading(false);
          if (error || !data) {
            toast({ variant: 'destructive', title: 'AI Error', description: error || 'Could not perform conversion.' });
            setDisplay('Error');
          } else {
            const result = data.result;
            setDisplay(result);
            setHistory(prev => [`${expression} = ${result}`, ...prev].slice(0, 20));
            const numericResult = result.match(/[\d.]+/)?.[0] || '0';
            setExpression(numericResult);
            setLastAnswer(numericResult);
          }
        } else {
          try {
            let evalExpression = finalExpression
              .replace(/×/g, '*')
              .replace(/÷/g, '/')
              .replace(/√/g, 'Math.sqrt')
              .replace(/log\(/g, 'Math.log10(')
              .replace(/ln\(/g, 'Math.log(')
              .replace(/abs\(/g, 'Math.abs(')
              .replace(/sinh\(/g, 'Math.sinh(')
              .replace(/cosh\(/g, 'Math.cosh(')
              .replace(/tanh\(/g, 'Math.tanh(')
              .replace(/asinh\(/g, 'Math.asinh(')
              .replace(/acosh\(/g, 'Math.acosh(')
              .replace(/atanh\(/g, 'Math.atanh(')
              .replace(/(\d+)C(\d+)/g, 'combinations($1, $2)')
              .replace(/(\d+)P(\d+)/g, 'permutations($1, $2)')
              .replace(/\^/g, '**')
              .replace(/π/g, 'Math.PI')
              .replace(/e/g, 'Math.E')
              .replace(/Ans/g, lastAnswer)
              .replace(/(\d+\.?\d*)!/g, (_, n) => `factorial(${n})`);
            
            // Angle mode conversions
            if (angleMode === 'DEG') {
                evalExpression = evalExpression
                    .replace(/sin\(([^)]+)\)/g, 'Math.sin(Math.PI/180 * ($1))')
                    .replace(/cos\(([^)]+)\)/g, 'Math.cos(Math.PI/180 * ($1))')
                    .replace(/tan\(([^)]+)\)/g, 'Math.tan(Math.PI/180 * ($1))')
                    .replace(/asin\(([^)]+)\)/g, '(180/Math.PI * Math.asin($1))')
                    .replace(/acos\(([^)]+)\)/g, '(180/Math.PI * Math.acos($1))')
                    .replace(/atan\(([^)]+)\)/g, '(180/Math.PI * Math.atan($1))');
            } else { // RAD mode
                 evalExpression = evalExpression
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/asin\(/g, 'Math.asin(')
                    .replace(/acos\(/g, 'Math.acos(')
                    .replace(/atan\(/g, 'Math.atan(');
            }
            
             evalExpression = evalExpression.replace(/(\d*\.?\d+)([+\-/*])(\d*\.?\d+)%/g, (match, p1, p2, p3) => {
              if (p2 === '+' || p2 === '-') {
                return `${p1}${p2}(${p1}*${p3}/100)`;
              }
              return match;
            });
            evalExpression = evalExpression.replace(/(\d+\.?\d*)%/g, '($1/100)');

            const result = new Function('factorial', 'combinations', 'permutations', 'return ' + evalExpression)(factorial, combinations, permutations);
            
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error("Invalid calculation");
            }

            const resultString = String(Number(result.toPrecision(12)));
            setDisplay(resultString);
            setHistory(prev => [`${expression} = ${resultString}`, ...prev].slice(0, 20));
            setExpression(resultString);
            setLastAnswer(resultString);
            setFractionResult(null);
          } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Calculation Error', description: 'Invalid mathematical expression.' });
            setDisplay('Error');
            setExpression('');
            setFractionResult(null);
          }
        }
        setIsResult(true);
        setIsShiftActive(false);
        break;
      
      default:
        break;
    }
  }, [expression, display, isResult, isAiLoading, toast, isHyperbolic, isShiftActive, angleMode, lastAnswer, memory, fractionResult]);
  
  const getDisplayButtons = useMemo((): CalcButton[] => {
    const numberClass = 'bg-neutral-200/50 dark:bg-neutral-800/50 text-foreground';
    const operatorClass = 'bg-accent/80 text-accent-foreground';
    const clearClass = 'bg-destructive/80 text-destructive-foreground';
    const functionClass = 'bg-primary/20 dark:bg-primary/10 text-primary dark:text-sky-300';
    const shiftClass = 'bg-yellow-500/80 dark:bg-yellow-400/80 text-yellow-900 dark:text-yellow-100';

    const baseButtons: Omit<CalcButton, 'key'>[] = [
      { value: '7', label: '7', type: 'number', className: numberClass },
      { value: '8', label: '8', type: 'number', className: numberClass },
      { value: '9', label: '9', type: 'number', className: numberClass },
      { value: '4', label: '4', type: 'number', className: numberClass },
      { value: '5', label: '5', type: 'number', className: numberClass },
      { value: '6', label: '6', type: 'number', className: numberClass },
      { value: '1', label: '1', type: 'number', className: numberClass },
      { value: '2', label: '2', type: 'number', className: numberClass },
      { value: '3', label: '3', type: 'number', className: numberClass },
      { value: '0', label: '0', type: 'number', className: numberClass },
      { value: '.', label: '.', type: 'decimal', className: numberClass },
      { value: '=', label: '=', type: 'equals', className: 'bg-accent text-accent-foreground' },
    ];
    
    if (isAdvanced) {
      const advancedButtons: Omit<CalcButton, 'key'>[] = [
        // Row 1
        { value: 'SHIFT', label: 'SHIFT', type: 'shift', className: cn(functionClass, isShiftActive ? shiftClass : '') },
        { value: 'hyp', label: 'hyp', type: 'advanced_func', className: cn(functionClass, isHyperbolic ? 'bg-accent/80 text-accent-foreground' : '') },
        { value: 'sin', label: 'sin', type: 'advanced_func', className: functionClass, shiftValue: 'asin', shiftLabel: <span>sin<sup>-1</sup></span> },
        { value: 'cos', label: 'cos', type: 'advanced_func', className: functionClass, shiftValue: 'acos', shiftLabel: <span>cos<sup>-1</sup></span> },
        { value: 'tan', label: 'tan', type: 'advanced_func', className: functionClass, shiftValue: 'atan', shiftLabel: <span>tan<sup>-1</sup></span> },

        // Row 2
        { value: 'x⁻¹', label: <span>x<sup>-1</sup></span>, type: 'advanced_func', className: functionClass, shiftValue: '!', shiftLabel: 'x!' },
        { value: 'log', label: 'log', type: 'advanced_func', className: functionClass, shiftValue: '10^', shiftLabel: <span>10<sup>x</sup></span> },
        { value: 'ln', label: 'ln', type: 'advanced_func', className: functionClass, shiftValue: 'e^', shiftLabel: <span>e<sup>x</sup></span> },
        { value: '(', label: '(', type: 'parenthesis', className: functionClass },
        { value: ')', label: ')', type: 'parenthesis', className: functionClass },

        // Row 3
        { value: 'x²', label: <span>x<sup>2</sup></span>, type: 'advanced_func', className: functionClass, shiftValue: '³√', shiftLabel: '³√' },
        { value: 'x³', label: <span>x<sup>3</sup></span>, type: 'advanced_func', className: functionClass, shiftValue: '√', shiftLabel: '√' },
        { value: '^', label: <span>x<sup>y</sup></span>, type: 'operator', className: functionClass, shiftValue: 'ⁿ√', shiftLabel: 'ⁿ√' },
        { value: 'abs', label: 'abs', type: 'advanced_func', className: functionClass },
        { value: 'AC', label: 'AC', type: 'clear', className: clearClass },
        
        // Row 4
        { value: 'C', label: 'nCr', type: 'combination', className: functionClass, shiftValue: 'P', shiftLabel: 'nPr' },
        ...baseButtons.slice(0, 3), // 7,8,9
        { value: 'DEL', label: <Delete />, type: 'delete', className: clearClass },

        // Row 5
        { value: '/', label: 'a b/c', type: 'fraction', className: functionClass },
        ...baseButtons.slice(3, 6), // 4,5,6
        { value: '×', label: <X />, type: 'operator', className: operatorClass },
        
        // Row 6
        { value: 'S-D', label: 'S↔D', type: 'sd_toggle', className: functionClass },
        ...baseButtons.slice(6, 9), // 1,2,3
        { value: '÷', label: <Divide />, type: 'operator', className: operatorClass },
        
        // Row 7
        { value: 'mc', label: 'MC', type: 'memory', className: functionClass },
        baseButtons[9], // 0
        baseButtons[10], // .
        { value: '-', label: <Minus />, type: 'operator', className: operatorClass },
        { value: '+', label: <Plus />, type: 'operator', className: operatorClass },

        // Row 8
        { value: 'm+', label: 'M+', type: 'memory', className: functionClass },
        { value: 'm-', label: 'M-', type: 'memory', className: functionClass },
        { value: 'mr', label: 'MR', type: 'memory', className: functionClass },
        { value: 'Ans', label: 'Ans', type: 'ans', className: functionClass },
        baseButtons[11], // =

      ];
      return advancedButtons.map((b, i) => ({ ...b, advanced: true, key: `adv-${b.value}-${i}` }));
    }

    const standardButtons: Omit<CalcButton, 'key'>[] = [
      { value: 'AC', label: 'AC', type: 'clear', className: clearClass },
      { value: 'DEL', label: <Delete />, type: 'delete', className: clearClass },
      { value: '%', label: <Percent />, type: 'percent', className: functionClass },
      { value: '÷', label: <Divide />, type: 'operator', className: operatorClass },

      ...baseButtons.slice(0, 3), // 7,8,9
      { value: '×', label: <X />, type: 'operator', className: operatorClass },
      
      ...baseButtons.slice(3, 6), // 4,5,6
      { value: '-', label: <Minus />, type: 'operator', className: operatorClass },

      ...baseButtons.slice(6, 9), // 1,2,3
      { value: '+', label: <Plus />, type: 'operator', className: operatorClass },
      
      { ...baseButtons[9], className: `col-span-2 ${numberClass}`}, // 0
      baseButtons[10], // .
      baseButtons[11], // =
    ];

    return standardButtons.map((b, i) => ({ ...b, advanced: false, key: `std-${b.value}-${i}`}));
  }, [isAdvanced, isHyperbolic, isShiftActive, memory]);


  return (
    <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl bg-card/60 backdrop-blur-3xl border-white/20 overflow-hidden transition-all duration-300 md:max-w-3xl">
      <CardContent className={cn("p-4 space-y-4", isAdvanced ? 'sm:p-3' : 'sm:p-6')}>
        <div className="flex justify-between items-center px-2">
            <div className='flex items-center gap-2'>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground"><History className="h-5 w-5"/></Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Calculation History</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-2 text-right">
                            {history.length > 0 ? history.map((item, index) => (
                                <p key={index} className="text-muted-foreground border-b pb-2">{item}</p>
                            )) : <p>No history yet.</p>}
                        </div>
                    </SheetContent>
                </Sheet>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                {isAdvanced && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Settings className="h-5 w-5" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Angle Unit</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Set the angle unit for trigonometric functions.
                                    </p>
                                </div>
                                <RadioGroup defaultValue={angleMode} onValueChange={(value: string) => setAngleMode(value as AngleMode)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="DEG" id="deg" />
                                        <Label htmlFor="deg">Degrees</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="RAD" id="rad" />
                                        <Label htmlFor="rad">Radians</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <Sigma className={cn("h-4 w-4 transition-colors", isAdvanced ? 'text-accent' : 'text-muted-foreground')} />
                <Switch id="advanced-mode" checked={isAdvanced} onCheckedChange={setIsAdvanced} />
            </div>
        </div>

        <div className="relative min-h-[100px] flex flex-col items-end justify-end p-4 text-right break-words">
          <div className="absolute top-2 left-4 flex items-center gap-2 text-xs font-bold">
             {isShiftActive && <span className='text-yellow-600 dark:text-yellow-400'>S</span>}
             {isHyperbolic && <span className='text-muted-foreground'>HYP</span>}
             {memory !== 0 && <span className='text-muted-foreground'>M</span>}
             {isAdvanced && <span className='text-muted-foreground'>{angleMode}</span>}
          </div>
          <p className="text-muted-foreground text-xl font-light w-full truncate">{expression || ' '}</p>
          <p className="text-5xl font-semibold w-full truncate">
            {isAiLoading ? <span className="animate-pulse">...</span> : (display)}
          </p>
        </div>

        <div className={cn("grid gap-2 transition-all", isAdvanced ? 'grid-cols-5 gap-y-2' : 'grid-cols-4')}>
          {getDisplayButtons.map((btn) => (
            <Button
              key={btn.key}
              onClick={() => handleButtonPress(btn)}
              className={cn(
                'btn-glass h-16 text-xl rounded-2xl font-medium shadow-md transition-all duration-200 relative', 
                'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                'hover:scale-105',
                btn.className,
                isAdvanced ? 'text-base h-12' : '',
                btn.value === '0' && !isAdvanced ? 'col-span-2' : '',
              )}
              aria-label={typeof btn.label === 'string' ? btn.label : btn.value}
            >
              {btn.shiftLabel && (
                  <span className='absolute top-1 left-2 text-[10px] text-yellow-600 dark:text-yellow-400 font-bold'>
                      {btn.value === 'SHIFT' ? '' : 'S'}
                  </span>
              )}
              {isShiftActive && btn.shiftLabel ? btn.shiftLabel : btn.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Calculator;

    
