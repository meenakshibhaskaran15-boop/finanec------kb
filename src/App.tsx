import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  created_at?: string;
}

interface SavingGoal {
  id: string;
  name: string;
  target_amount: number;
  created_at?: string;
}

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Other', 'Salary', 'Freelance'];

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transaction Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transRes, goalsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('saving_goals').select('*').order('created_at', { ascending: true })
      ]);

      if (transRes.error) throw transRes.error;
      if (goalsRes.error) throw goalsRes.error;

      setTransactions(transRes.data || []);
      setGoals(goalsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTransaction = {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString(),
      type
    };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();

      if (error) throw error;
      if (data) {
        setTransactions([data[0], ...transactions]);
        setDescription('');
        setAmount('');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      // alert('Failed to add transaction. Check your Supabase connection.'); // Removed alert
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // alert('Failed to delete transaction.'); // Removed alert
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTarget) return;

    const newGoal = {
      name: goalName,
      target_amount: parseFloat(goalTarget)
    };

    try {
      const { data, error } = await supabase
        .from('saving_goals')
        .insert([newGoal])
        .select();

      if (error) throw error;
      if (data) {
        setGoals([...goals, data[0]]);
        setGoalName('');
        setGoalTarget('');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal.');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvData = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      t.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ledger-lite-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = transactions.reduce((acc, current) => {
    if (current.type === 'income') acc.income += current.amount;
    else acc.expense += current.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ledger-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ledger-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <main className="animate-in">
      <header style={{ marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              padding: '0.6rem 1rem',
              boxShadow: 'none',
              fontSize: '1.2rem'
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>LedgerLite</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Zero-friction expense tracking • Cloud Synced</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass card" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Balance</span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="glass card" style={{ textAlign: 'center', borderBottom: '4px solid var(--success)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Income</span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--success)' }}>
            +₹{totals.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="glass card" style={{ textAlign: 'center', borderBottom: '4px solid var(--danger)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expenses</span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--danger)' }}>
            -₹{totals.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Saving Goals</h3>
          <form onSubmit={addGoal} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              placeholder="Goal Name"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
              style={{ margin: 0 }}
            />
            <input
              type="number"
              placeholder="Target ₹"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              required
              style={{ margin: 0, width: '120px' }}
            />
            <button type="submit" style={{ margin: 0, padding: '0.8rem' }}>+</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {goals.map(goal => {
              const progress = Math.min((balance / goal.target_amount) * 100, 100);
              const isAchieved = progress >= 100;
              return (
                <div key={goal.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600' }}>{goal.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        ₹{balance.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        style={{ background: 'transparent', padding: '0.2rem', boxShadow: 'none', color: 'var(--danger)', fontSize: '0.7rem', margin: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progress < 0 ? 0 : progress}%`,
                      background: isAchieved ? 'var(--success)' : 'var(--accent-primary)',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No saving goals yet.</p>}
          </div>
        </div>

        <div className="glass card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add Transaction</h3>
          <form onSubmit={addTransaction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  style={{ flex: 1, margin: 0, background: type === 'expense' ? 'var(--danger)' : 'transparent', border: '1px solid var(--danger)', opacity: type === 'expense' ? 1 : 0.6 }}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  style={{ flex: 1, margin: 0, background: type === 'income' ? 'var(--success)' : 'transparent', border: '1px solid var(--success)', opacity: type === 'income' ? 1 : 0.6 }}
                >
                  Income
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ margin: 0, gridColumn: 'span 2' }}
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              required
              style={{ margin: 0 }}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ margin: 0 }}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button type="submit" style={{ gridColumn: 'span 2', margin: 0 }}>
              Save Transaction
            </button>
          </form>
        </div>
      </div>

      <section className="glass card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Transaction History</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px', margin: 0 }}
            />
            <button onClick={exportToCSV} style={{ margin: 0, background: 'var(--primary)', opacity: transactions.length ? 1 : 0.5 }}>
              Export
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>Fetching data...</p>
          ) : filteredTransactions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>No transactions found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Description</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="table-row">
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{t.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        style={{ padding: '0.4rem', background: 'transparent', boxShadow: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
