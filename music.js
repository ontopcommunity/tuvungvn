(function() {
  const PLAY_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 3l14 9-14 9V3z"/></svg>`;
  const PAUSE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>`;
  const PREV_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 6v12l10-6-10-6z"/><rect x="5" y="4" width="3" height="16" rx="1"/></svg>`;
  const NEXT_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 6v12l-10-6 10-6z"/><rect x="16" y="4" width="3" height="16" rx="1"/></svg>`;
  const SEARCH_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>`;
  const COLLAPSE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 10 12 16 18 10"/></svg>`;
  const EXPAND_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 14 12 8 6 14"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  let audio = null;
  let currentTrackIndex = -1;
  let currentPlaylist = [];
  let isPlaying = false;
  let audioProgressInterval = null;

  function stopProgressInterval() {
    if (audioProgressInterval) { clearInterval(audioProgressInterval); audioProgressInterval = null; }
  }

  function startProgressInterval() {
    stopProgressInterval();
    audioProgressInterval = setInterval(updateProgressUI, 200);
  }

  function updateProgressUI() {
    if (!audio || !audio.duration) return;
    const progressBar = document.getElementById('miniPlayerProgressBar');
    const currentTimeEl = document.getElementById('miniPlayerCurrentTime');
    const durationEl = document.getElementById('miniPlayerDuration');
    if (progressBar) progressBar.style.width = (audio.currentTime / audio.duration) * 100 + '%';
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (durationEl && !isNaN(audio.duration)) durationEl.textContent = formatTime(audio.duration);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  function createMiniPlayerUI() {
    if (document.getElementById('miniPlayer')) return;
    const mini = document.createElement('div');
    mini.id = 'miniPlayer';
    mini.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      z-index: 9999999;
      background: rgba(20, 20, 35, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #fff;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      font-family: system-ui, -apple-system, sans-serif;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1.2);
      width: 420px;
      max-width: calc(100vw - 32px);
      overflow: hidden;
      user-select: none;
      display: none;
    `;

    mini.innerHTML = `
      <div class="player-expanded" style="display:flex; flex-direction:column; padding:16px 20px 12px;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:12px;">
          <img id="miniPlayerThumb" style="width:56px; height:56px; border-radius:50%; object-fit:cover; background:#313244; border:2px solid rgba(137,180,250,0.4);">
          <div style="flex:1; min-width:0;">
            <div id="miniPlayerTitle" style="font-weight:600; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Chưa chọn nhạc</div>
            <div id="miniPlayerAuthor" style="font-size:12px; color:#a6adc8; margin-top:2px;">-</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button id="miniPlayerPrev" class="ctrl-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; cursor: pointer; padding: 8px; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${PREV_ICON}</button>
            <button id="miniPlayerPlay" class="ctrl-btn play-btn" style="background: #89b4fa; border: none; color: #111; cursor: pointer; padding: 10px; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(137,180,250,0.4);">${PLAY_ICON}</button>
            <button id="miniPlayerNext" class="ctrl-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; cursor: pointer; padding: 8px; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${NEXT_ICON}</button>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <span id="miniPlayerCurrentTime" style="font-size:11px; color:#a6adc8; min-width:32px;">0:00</span>
          <div style="flex:1; height:4px; background: rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; cursor:pointer;" id="progressBarContainer">
            <div id="miniPlayerProgressBar" style="width:0%; height:100%; background: #89b4fa; border-radius:2px; transition: width 0.1s linear;"></div>
          </div>
          <span id="miniPlayerDuration" style="font-size:11px; color:#a6adc8; min-width:32px;">0:00</span>
        </div>
        <div style="display:flex; justify-content: flex-end; gap:10px; align-items:center;">
          <button id="miniPlayerSearchBtn" class="ctrl-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; cursor: pointer; padding: 6px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;" title="Tìm kiếm">${SEARCH_ICON}</button>
          <button id="miniPlayerCollapse" class="ctrl-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; cursor: pointer; padding: 6px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">${COLLAPSE_ICON}</button>
          <button id="miniPlayerClose" class="ctrl-btn" style="background: rgba(255,255,255,0.1); border: none; color: #f38ba8; cursor: pointer; padding: 6px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;" title="Tắt nhạc">${CLOSE_ICON}</button>
        </div>
      </div>
    `;
    document.body.appendChild(mini);

    const style = document.createElement('style');
    style.textContent = `
      #progressBarContainer:hover { background: rgba(255,255,255,0.2); }
      .ctrl-btn:hover { background: rgba(255,255,255,0.2) !important; }
      .play-btn:hover { background: #74c7ec !important; transform: scale(1.05); }
      .play-btn:active { transform: scale(0.95); }
    `;
    document.head.appendChild(style);

    document.getElementById('miniPlayerPlay').addEventListener('click', playPause);
    document.getElementById('miniPlayerPrev').addEventListener('click', prevTrack);
    document.getElementById('miniPlayerNext').addEventListener('click', nextTrack);
    document.getElementById('miniPlayerClose').addEventListener('click', closePlayer);
    document.getElementById('miniPlayerSearchBtn').addEventListener('click', openMusicSearch);
    document.getElementById('miniPlayerCollapse').addEventListener('click', toggleCollapse);
    document.getElementById('progressBarContainer').addEventListener('click', (e) => {
      if (!audio || !audio.duration) return;
      const rect = e.target.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });
  }

  function toggleCollapse() {
    const player = document.getElementById('miniPlayer');
    if (!player) return;
    const isCollapsed = player.classList.contains('collapsed');
    if (isCollapsed) {
      player.classList.remove('collapsed');
      player.style.width = '420px';
      player.querySelector('.player-expanded').style.display = 'flex';
      const collapsedView = player.querySelector('.player-collapsed');
      if (collapsedView) collapsedView.remove();
    } else {
      player.classList.add('collapsed');
      player.style.width = '280px';
      const expanded = player.querySelector('.player-expanded');
      if (expanded) expanded.style.display = 'none';
      let collapsedView = player.querySelector('.player-collapsed');
      if (!collapsedView) {
        collapsedView = document.createElement('div');
        collapsedView.className = 'player-collapsed';
        collapsedView.style.cssText = 'display:flex; align-items:center; padding:10px 16px; gap:10px;';
        player.appendChild(collapsedView);
      }
      collapsedView.innerHTML = `
        <img id="miniPlayerThumbCollapsed" src="${document.getElementById('miniPlayerThumb').src}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(137,180,250,0.4);">
        <div style="flex:1; min-width:0;">
          <div id="miniPlayerTitleCollapsed" style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${document.getElementById('miniPlayerTitle').textContent}</div>
          <div id="miniPlayerProgressCollapsed" style="height:2px; background: rgba(255,255,255,0.1); margin-top:4px; border-radius:1px; overflow:hidden;">
            <div style="height:100%; width:${audio && audio.duration ? (audio.currentTime/audio.duration)*100 : 0}%; background:#89b4fa; transition: width 0.2s;"></div>
          </div>
        </div>
        <button id="miniPlayerPlayCollapsed" style="background:#89b4fa; border:none; color:#111; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;">${isPlaying ? PAUSE_ICON : PLAY_ICON}</button>
        <button id="miniPlayerExpand" class="ctrl-btn" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer;">${EXPAND_ICON}</button>
      `;
      document.getElementById('miniPlayerPlayCollapsed').addEventListener('click', playPause);
      document.getElementById('miniPlayerExpand').addEventListener('click', toggleCollapse);
      function updateCollapsedProgress() {
        const bar = document.querySelector('#miniPlayerProgressCollapsed div');
        if (bar && audio && audio.duration) bar.style.width = (audio.currentTime / audio.duration) * 100 + '%';
      }
      setInterval(updateCollapsedProgress, 500);
    }
  }

  function showMiniPlayer() {
    const mini = document.getElementById('miniPlayer');
    if (mini) mini.style.display = 'block';
  }

  function hideMiniPlayer() { 
    const mini = document.getElementById('miniPlayer');
    if (mini) mini.style.display = 'none';
  }

  function closePlayer() {
    if (audio) { audio.pause(); audio = null; }
    isPlaying = false;
    stopProgressInterval();
    hideMiniPlayer();
    const player = document.getElementById('miniPlayer');
    if (player && player.classList.contains('collapsed')) toggleCollapse();
  }

  function playPause() {
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      isPlaying = true;
      document.getElementById('miniPlayerPlay').innerHTML = PAUSE_ICON;
      const playCollapsed = document.getElementById('miniPlayerPlayCollapsed');
      if (playCollapsed) playCollapsed.innerHTML = PAUSE_ICON;
      startProgressInterval();
    } else {
      audio.pause();
      isPlaying = false;
      document.getElementById('miniPlayerPlay').innerHTML = PLAY_ICON;
      const playCollapsed = document.getElementById('miniPlayerPlayCollapsed');
      if (playCollapsed) playCollapsed.innerHTML = PLAY_ICON;
      stopProgressInterval();
    }
  }

  function loadTrack(index) {
    if (index < 0 || index >= currentPlaylist.length) return;
    const track = currentPlaylist[index];
    currentTrackIndex = index;
    if (audio) { audio.pause(); audio = null; }
    audio = new Audio(track.direct_stream_url);
    audio.addEventListener('loadedmetadata', updateProgressUI);
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('play', () => {
      isPlaying = true;
      document.getElementById('miniPlayerPlay').innerHTML = PAUSE_ICON;
      const playCollapsed = document.getElementById('miniPlayerPlayCollapsed');
      if (playCollapsed) playCollapsed.innerHTML = PAUSE_ICON;
      startProgressInterval();
    });
    audio.addEventListener('pause', () => {
      isPlaying = false;
      document.getElementById('miniPlayerPlay').innerHTML = PLAY_ICON;
      const playCollapsed = document.getElementById('miniPlayerPlayCollapsed');
      if (playCollapsed) playCollapsed.innerHTML = PLAY_ICON;
      stopProgressInterval();
    });
    audio.play();
    isPlaying = true;
    document.getElementById('miniPlayerPlay').innerHTML = PAUSE_ICON;
    document.getElementById('miniPlayerThumb').src = track.thumbnail || '';
    document.getElementById('miniPlayerTitle').textContent = track.title;
    document.getElementById('miniPlayerAuthor').textContent = track.author;
    const collapsedTitle = document.getElementById('miniPlayerTitleCollapsed');
    if (collapsedTitle) collapsedTitle.textContent = track.title;
    const collapsedThumb = document.getElementById('miniPlayerThumbCollapsed');
    if (collapsedThumb) collapsedThumb.src = track.thumbnail || '';
    createMiniPlayerUI();
    showMiniPlayer();
    startProgressInterval();
  }

  function playTrack(track, playlist) {
    currentPlaylist = playlist;
    const idx = playlist.findIndex(t => t.id === track.id);
    loadTrack(idx);
  }

  function prevTrack() {
    if (currentPlaylist.length === 0) return;
    let idx = currentTrackIndex - 1;
    if (idx < 0) idx = currentPlaylist.length - 1;
    loadTrack(idx);
  }

  function nextTrack() {
    if (currentPlaylist.length === 0) return;
    let idx = currentTrackIndex + 1;
    if (idx >= currentPlaylist.length) idx = 0;
    loadTrack(idx);
  }

  function openMusicSearch() {
    if (document.getElementById('musicSearchModal')) return;
    const modal = document.createElement('div');
    modal.id = 'musicSearchModal';
    modal.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(20,20,35,0.95); backdrop-filter: blur(10px);
      color: #fff; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 20px; z-index: 1000002;
      width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      font-family: system-ui, sans-serif;
    `;
    modal.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3 style="margin:0; color:#89b4fa;">🎵 Tìm kiếm nhạc</h3>
        <button id="closeMusicModal" style="background:none; border:none; color:#f38ba8; font-size:20px; cursor:pointer;">✕</button>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:15px;">
        <input id="musicSearchInput" type="text" placeholder="Nhập tên bài hát..." style="flex:1; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:6px;">
        <button id="musicSearchBtn" style="background:#89b4fa; color:#111; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Tìm</button>
      </div>
      <div id="musicResults" style="max-height:50vh; overflow-y:auto;"></div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeMusicModal').onclick = () => modal.remove();
    document.getElementById('musicSearchBtn').onclick = () => {
      const query = document.getElementById('musicSearchInput').value.trim();
      if (query) searchMusic(query);
    };
    document.getElementById('musicSearchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) searchMusic(query);
      }
    });
  }

  async function searchMusic(query) {
    const resultsDiv = document.getElementById('musicResults');
    resultsDiv.innerHTML = '<p style="text-align:center;color:#a6adc8;">Đang tìm...</p>';
    try {
      const response = await fetch(`https://apisynthesis.vercel.app/api?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!data.tracks || data.tracks.length === 0) {
        resultsDiv.innerHTML = '<p style="color:#f38ba8;">Không tìm thấy bài hát nào.</p>';
        return;
      }
      renderTracks(data.tracks);
    } catch (err) {
      resultsDiv.innerHTML = `<p style="color:#f38ba8;">Lỗi: ${err.message}</p>`;
    }
  }

  function renderTracks(tracks) {
    const resultsDiv = document.getElementById('musicResults');
    resultsDiv.innerHTML = '';
    tracks.forEach(track => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition: background 0.2s;';
      item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.05)';
      item.onmouseout = () => item.style.background = 'transparent';
      item.innerHTML = `
        <img src="${track.thumbnail}" style="width:44px; height:44px; border-radius:6px; object-fit:cover; margin-right:12px;">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:bold; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.title}</div>
          <div style="font-size:11px; color:#a6adc8;">${track.author} • ${formatDuration(track.duration)}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        playTrack(track, tracks);
        document.getElementById('musicSearchModal')?.remove();
      });
      resultsDiv.appendChild(item);
    });
  }

  window.MusicPlayer = {
    open: openMusicSearch,
    play: playTrack,
    pause: playPause,
    next: nextTrack,
    prev: prevTrack,
    getCurrentTrack: () => currentPlaylist[currentTrackIndex] || null,
    isPlaying: () => isPlaying,
  };

  createMiniPlayerUI();
  console.log('🎵 Music Player đã sẵn sàng. Dùng MusicPlayer.open() để mở tìm kiếm.');
})();
