import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Calendar, Filter, CheckCircle2, Circle, Edit2, X, Save, Bell, AlertCircle } from 'lucide-react';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('個人');
  const [selectedPriority, setSelectedPriority] = useState('中');
  const [selectedStatus, setSelectedStatus] = useState('未着手');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const categories = ['仕事', '個人', '買い物', '勉強', 'その他'];
  const priorities = ['高', '中', '低'];
  const statuses = ['未着手', '進行中', '完了', '保留'];

  // ローカルストレージから読み込み
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // タスク変更時に保存
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // 通知をチェック
  useEffect(() => {
    const checkNotifications = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const newNotifications = [];

      tasks.forEach(task => {
        if (task.status === '完了' || !task.endDate) return;

        const endDate = new Date(task.endDate);
        endDate.setHours(0, 0, 0, 0);

        // 当日の通知
        if (endDate.getTime() === today.getTime()) {
          newNotifications.push({
            id: `${task.id}-today`,
            type: 'today',
            task: task,
            message: `今日が期限です`
          });
        }

        // 1日前の通知
        if (endDate.getTime() === tomorrow.getTime()) {
          newNotifications.push({
            id: `${task.id}-tomorrow`,
            type: 'tomorrow',
            task: task,
            message: `明日が期限です`
          });
        }
      });

      setNotifications(newNotifications);
    };

    checkNotifications();
    // 1時間ごとにチェック
    const interval = setInterval(checkNotifications, 3600000);
    return () => clearInterval(interval);
  }, [tasks]);

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const addTask = () => {
    if (newTask.trim() === '') return;

    const task = {
      id: Date.now(),
      text: newTask,
      category: selectedCategory,
      priority: selectedPriority,
      status: selectedStatus,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString()
    };

    setTasks([...tasks, task]);
    setNewTask('');
    setStartDate('');
    setEndDate('');
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    if (editingTask?.id === id) {
      setEditingTask(null);
    }
  };

  const startEdit = (task) => {
    setEditingTask({ ...task });
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const saveEdit = () => {
    setTasks(tasks.map(task =>
      task.id === editingTask.id ? editingTask : task
    ));
    setEditingTask(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case '高': return 'bg-red-500';
      case '中': return 'bg-yellow-500';
      case '低': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      '仕事': 'bg-blue-500',
      '個人': 'bg-purple-500',
      '買い物': 'bg-pink-500',
      '勉強': 'bg-indigo-500',
      'その他': 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '未着手': return 'bg-gray-500';
      case '進行中': return 'bg-blue-500';
      case '完了': return 'bg-green-500';
      case '保留': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const isOverdue = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return end < today;
  };

  const isDueToday = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate).toDateString() === new Date().toDateString();
  };

  const isInProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return today >= start && today <= end;
  };

  const filteredTasks = tasks.filter(task => {
    const categoryMatch = filterCategory === 'all' || task.category === filterCategory;
    let statusMatch = false;
    
    if (filterStatus === 'all') {
      statusMatch = true;
    } else if (filterStatus === '期限切れ') {
      statusMatch = task.status !== '完了' && isOverdue(task.endDate);
    } else {
      statusMatch = task.status === filterStatus;
    }
    
    return categoryMatch && statusMatch;
  });

  const stats = {
    total: tasks.length,
    notStarted: tasks.filter(t => t.status === '未着手').length,
    active: tasks.filter(t => t.status === '進行中').length,
    completed: tasks.filter(t => t.status === '完了').length,
    onHold: tasks.filter(t => t.status === '保留').length,
    overdue: tasks.filter(t => t.status !== '完了' && isOverdue(t.endDate)).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            TODO Manager
          </h1>
          <p className="text-blue-300">シンプルで強力なタスク管理</p>
        </div>

        {/* 通知バナー */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 rounded-lg backdrop-blur-md ${
                  notification.type === 'today'
                    ? 'bg-red-500/20 border border-red-500/50'
                    : 'bg-orange-500/20 border border-orange-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell
                    size={20}
                    className={notification.type === 'today' ? 'text-red-400' : 'text-orange-400'}
                  />
                  <div>
                    <p className="text-white font-semibold">{notification.task.text}</p>
                    <p className={`text-sm ${
                      notification.type === 'today' ? 'text-red-300' : 'text-orange-300'
                    }`}>
                      {notification.message} - {new Date(notification.task.endDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-blue-300 text-sm">総タスク</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">{stats.notStarted}</div>
            <div className="text-blue-300 text-sm">未着手</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.active}</div>
            <div className="text-blue-300 text-sm">進行中</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-blue-300 text-sm">完了</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{stats.onHold}</div>
            <div className="text-blue-300 text-sm">保留</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{stats.overdue}</div>
            <div className="text-blue-300 text-sm">期限切れ</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* サイドバー */}
          <div className="md:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Filter size={18} />
                フィルター
              </h2>
              
              {/* ステータスフィルター */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-300 mb-2">ステータス</label>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-blue-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none shadow-lg hover:shadow-blue-500/10 transition-all"
                  >
                    <option value="all" className="bg-slate-800">すべて</option>
                    {statuses.map(status => (
                      <option key={status} value={status} className="bg-slate-800">{status}</option>
                    ))}
                    <option value="期限切れ" className="bg-slate-800">期限切れ</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* カテゴリーフィルター */}
              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">カテゴリー</label>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-purple-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 cursor-pointer appearance-none shadow-lg hover:shadow-purple-500/10 transition-all"
                  >
                    <option value="all" className="bg-slate-800">すべて</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-slate-800">{category}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="md:col-span-2">
            {/* タスク追加フォーム */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">新しいタスク</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="タスクを入力..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">カテゴリー</label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none shadow-lg hover:shadow-blue-500/10 transition-all"
                      >
                        {categories.map(c => (
                          <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">優先度</label>
                    <div className="relative">
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-yellow-500/30 rounded-xl text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 cursor-pointer appearance-none shadow-lg hover:shadow-yellow-500/10 transition-all"
                      >
                        {priorities.map(p => (
                          <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-400">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">ステータス</label>
                    <div className="relative">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-green-500/30 rounded-xl text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/20 cursor-pointer appearance-none shadow-lg hover:shadow-green-500/10 transition-all"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-400">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">📅 開始日</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 shadow-lg [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">📅 終了日</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      className="w-full px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 shadow-lg [color-scheme:dark]"
                    />
                  </div>
                </div>

                <button
                  onClick={addTask}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  タスクを追加
                </button>
              </div>
            </div>

            {/* タスクリスト */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-12 text-center">
                  <p className="text-gray-400 text-lg">タスクがありません</p>
                  <p className="text-gray-500 text-sm mt-2">上のフォームから新しいタスクを追加しましょう</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white/10 backdrop-blur-md rounded-lg p-4 transition-all hover:bg-white/15"
                  >
                    {editingTask?.id === task.id ? (
                      // 編集モード
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingTask.text}
                          onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-blue-300 mb-1">カテゴリー</label>
                              <div className="relative">
                                <select
                                  value={editingTask.category}
                                  onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                                  className="w-full px-3 py-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none shadow-lg"
                                >
                                  {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-blue-300 mb-1">優先度</label>
                              <div className="relative">
                                <select
                                  value={editingTask.priority}
                                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                                  className="w-full px-3 py-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-yellow-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 cursor-pointer appearance-none shadow-lg"
                                >
                                  {priorities.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-400">
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-blue-300 mb-1">ステータス</label>
                              <div className="relative">
                                <select
                                  value={editingTask.status}
                                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                                  className="w-full px-3 py-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-green-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/20 cursor-pointer appearance-none shadow-lg"
                                >
                                  {statuses.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-green-400">
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-blue-300 mb-1">📅 開始日</label>
                              <input
                                type="date"
                                value={editingTask.startDate || ''}
                                onChange={(e) => setEditingTask({ ...editingTask, startDate: e.target.value })}
                                className="w-full px-3 py-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 shadow-lg [color-scheme:dark]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-blue-300 mb-1">📅 終了日</label>
                              <input
                                type="date"
                                value={editingTask.endDate || ''}
                                onChange={(e) => setEditingTask({ ...editingTask, endDate: e.target.value })}
                                min={editingTask.startDate || undefined}
                                className="w-full px-3 py-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 shadow-lg [color-scheme:dark]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Save size={18} />
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={18} />
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 表示モード
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-2">
                            {task.text}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs text-white ${getCategoryColor(task.category)}`}>
                              {task.category}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(task.priority)}`}>
                              優先度: {task.priority}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs text-white ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            {(task.startDate || task.endDate) && (
                              <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                                isOverdue(task.endDate) ? 'bg-red-500 text-white' :
                                isDueToday(task.endDate) ? 'bg-orange-500 text-white' :
                                isInProgress(task.startDate, task.endDate) ? 'bg-blue-500 text-white' :
                                'bg-white/20 text-gray-300'
                              }`}>
                                <Calendar size={12} />
                                {task.startDate && task.endDate && task.startDate === task.endDate ? (
                                  // 開始日と終了日が同じ場合は1日だけ表示
                                  new Date(task.startDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                                ) : (
                                  // 異なる場合は範囲表示
                                  <>
                                    {task.startDate && new Date(task.startDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                    {task.startDate && task.endDate && ' - '}
                                    {task.endDate && new Date(task.endDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(task)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
ReactDOM.render(React.createElement(TaskManager), document.getElementById('root'));
