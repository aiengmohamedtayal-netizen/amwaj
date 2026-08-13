import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowUpRight, Camera, Check, ChevronDown, CircleHelp, Clock3, Download,
  Film, FolderOpen, Grid2X2, Keyboard, LayoutDashboard, LockKeyhole, Mic, Monitor,
  MoreHorizontal, MousePointer2, Pause, Play, Plus, Redo2, RefreshCw, Save, Scissors,
  ScreenShare, Settings, SlidersHorizontal, Sparkles, Square, Trash2, Undo2, Upload,
  Volume2, WandSparkles, X, ZoomIn
} from 'lucide-react';
import './styles.css';

const desktop = window.captureDesktop;

const createScene = (index = 1) => ({
  id: `scene-${Date.now()}-${index}`,
  name: `المشهد ${String(index).padStart(2, '0')}`,
  shortcut: `F${Math.min(index, 3)}`,
  type: index === 3 ? 'camera' : 'screen',
  camera: index === 3,
  audio: true,
  cursor: true,
  zoom: index === 2,
  sourceId: null
});

const starterScenes = [createScene(1), createScene(2), createScene(3)];
const starterProject = {
  name: 'مشروع شرح جديد',
  ratio: '16:9',
  quality: '1440p',
  fps: 30,
  scenes: starterScenes,
  clips: [],
  updatedAt: new Date().toISOString()
};

const pad = (value) => String(value).padStart(2, '0');
const formatTime = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(Math.floor(seconds % 60))}`;
const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function App() {
  const [activeView, setActiveView] = useState('studio');
  const [project, setProject] = useState(starterProject);
  const [scenes, setScenes] = useState(starterScenes);
  const [clips, setClips] = useState([]);
  const [activeSceneId, setActiveSceneId] = useState(starterScenes[0].id);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);
  const [notice, setNotice] = useState({ type: 'neutral', text: 'جاهز للتسجيل' });
  const [isStarting, setIsStarting] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(100);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const activeScene = scenes.find((scene) => scene.id === activeSceneId) || scenes[0];
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) || clips[clips.length - 1];
  const activeSource = sources.find((source) => source.id === selectedSourceId);

  const loadSources = async () => {
    try {
      const result = desktop ? await desktop.getSources() : [];
      setSources(result);
      if (result.length && !selectedSourceId) setSelectedSourceId(result[0].id);
      setNotice({ type: 'neutral', text: result.length ? `${result.length} مصادر متاحة` : 'اختر مصدر التسجيل للبدء' });
    } catch (error) {
      console.error(error);
      setNotice({ type: 'error', text: 'تعذر الوصول إلى مصادر الشاشة' });
    }
  };

  useEffect(() => {
    loadSources();
    const onGlobalToggle = () => startRecording();
    const removeGlobalToggle = desktop?.onToggleRecording?.(onGlobalToggle);
    const onKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const scene = scenes.find((item) => item.shortcut.toLowerCase() === event.key.toLowerCase());
      if (scene) {
        event.preventDefault();
        setActiveSceneId(scene.id);
        setNotice({ type: 'neutral', text: `تم التبديل إلى ${scene.name}` });
      }
      if (event.code === 'Space') {
        event.preventDefault();
        if (isRecording) togglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      removeGlobalToggle?.();
    };
  }, [isRecording, scenes]);

  useEffect(() => {
    if (!isRecording) {
      clearInterval(timerRef.current);
      return undefined;
    }
    startedAtRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();
  }, []);

  const setCurrentScene = (patch) => {
    setScenes((items) => items.map((scene) => scene.id === activeSceneId ? { ...scene, ...patch } : scene));
  };

  const getCaptureStream = async () => {
    const sourceId = selectedSourceId;
    if (desktop && sourceId) await desktop.setSource(sourceId);
    const videoConstraints = sourceId && desktop ? {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
        maxWidth: 2560,
        maxHeight: 1440,
        maxFrameRate: project.fps
      }
    } : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: project.fps } };
    const desktopStream = desktop && sourceId
      ? await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: systemAudioEnabled ? { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId } } : false
        })
      : await navigator.mediaDevices.getDisplayMedia({ video: videoConstraints, audio: systemAudioEnabled });

    if (!micEnabled) return desktopStream;
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      if (desktopStream.getAudioTracks().length) audioContext.createMediaStreamSource(desktopStream).connect(destination);
      audioContext.createMediaStreamSource(micStream).connect(destination);
      audioContextRef.current = audioContext;
      return new MediaStream([...desktopStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
    } catch (error) {
      console.warn('Microphone unavailable, continuing with screen audio:', error);
      return desktopStream;
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!selectedSourceId && desktop) {
      setIsSourcePickerOpen(true);
      setNotice({ type: 'warning', text: 'اختر الشاشة أو النافذة التي تريد تسجيلها أولًا' });
      return;
    }
    setIsStarting(true);
    setNotice({ type: 'neutral', text: 'جارٍ تجهيز التسجيل…' });
    try {
      const stream = await getCaptureStream();
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const preferredMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: preferredMime, videoBitsPerSecond: project.quality === '1440p' ? 9000000 : 5000000 });
      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
      recorder.onstop = finishRecording;
      recorder.onerror = () => setNotice({ type: 'error', text: 'حدث خطأ أثناء التسجيل' });
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setElapsed(0);
      setIsStarting(false);
      setNotice({ type: 'recording', text: 'يتم التسجيل الآن' });
    } catch (error) {
      console.error(error);
      setIsStarting(false);
      setNotice({ type: 'error', text: 'لم يتم بدء التسجيل. تحقق من أذونات الشاشة والميكروفون.' });
    }
  };

  const finishRecording = () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const duration = Math.max(elapsed, 1);
    const clip = {
      id: id('clip'),
      name: `تسجيل ${clips.length + 1}`,
      duration,
      trimStart: 0,
      trimEnd: duration,
      url,
      blob,
      size: blob.size,
      scene: activeScene?.name || 'المشهد 01',
      createdAt: new Date().toISOString()
    };
    setClips((items) => [...items, clip]);
    setSelectedClipId(clip.id);
    setRecordingUrl(url);
    setIsRecording(false);
    setIsPaused(false);
    setElapsed(0);
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setNotice({ type: 'success', text: `تم حفظ التسجيل — ${formatTime(duration)}` });
  };

  const togglePause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'recording') {
      recorder.pause();
      setIsPaused(true);
      setNotice({ type: 'neutral', text: 'التسجيل متوقف مؤقتًا' });
    } else if (recorder.state === 'paused') {
      recorder.resume();
      setIsPaused(false);
      setNotice({ type: 'recording', text: 'يتم التسجيل الآن' });
    }
  };

  const addScene = () => {
    const scene = createScene(scenes.length + 1);
    setScenes((items) => [...items, scene]);
    setActiveSceneId(scene.id);
    setNotice({ type: 'success', text: 'تمت إضافة مشهد جديد' });
  };

  const deleteScene = (sceneId) => {
    if (scenes.length <= 1) return;
    const next = scenes.filter((scene) => scene.id !== sceneId);
    setScenes(next);
    if (activeSceneId === sceneId) setActiveSceneId(next[0].id);
  };

  const selectSource = async (source) => {
    setSelectedSourceId(source.id);
    setCurrentScene({ sourceId: source.id });
    if (desktop) await desktop.setSource(source.id);
    setIsSourcePickerOpen(false);
    setNotice({ type: 'success', text: `المصدر المحدد: ${source.name}` });
  };

  const saveProject = async () => {
    const serializableClips = clips.map(({ blob, url, ...clip }) => clip);
    const payload = { ...project, scenes, clips: serializableClips, updatedAt: new Date().toISOString() };
    if (desktop) {
      const result = await desktop.saveProject(payload);
      if (result?.canceled) return;
    } else {
      localStorage.setItem('capture-project', JSON.stringify(payload));
    }
    setProjectSaved(true);
    setNotice({ type: 'success', text: 'تم حفظ المشروع بنجاح' });
    setTimeout(() => setProjectSaved(false), 1800);
  };

  const openProject = async () => {
    if (desktop) {
      const result = await desktop.openProject();
      if (result?.canceled) return;
      if (result?.project) {
        setProject((current) => ({ ...current, ...result.project }));
        setScenes(result.project.scenes || starterScenes);
        setClips([]);
        setNotice({ type: 'success', text: 'تم فتح المشروع — أعد استيراد المقاطع لتحريرها' });
      }
    } else {
      const raw = localStorage.getItem('capture-project');
      if (raw) {
        const saved = JSON.parse(raw);
        setProject((current) => ({ ...current, ...saved }));
        setScenes(saved.scenes || starterScenes);
        setNotice({ type: 'success', text: 'تم فتح المشروع المحفوظ' });
      }
    }
    setIsProjectMenuOpen(false);
  };

  const exportClip = async () => {
    if (!selectedClip?.blob) {
      setNotice({ type: 'warning', text: 'سجّل مقطعًا أولًا كي تتمكن من تصديره' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      if (desktop) {
        const result = await desktop.exportVideo({ dataUrl, name: selectedClip.name, extension: 'webm' });
        if (result?.canceled) return;
        setNotice({ type: 'success', text: 'تم تصدير الفيديو بنجاح' });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${selectedClip.name}.webm`;
        link.click();
        setNotice({ type: 'success', text: 'بدأ تنزيل الفيديو' });
      }
    };
    reader.readAsDataURL(selectedClip.blob);
  };

  const updateClip = (patch) => {
    if (!selectedClip) return;
    setClips((items) => items.map((clip) => clip.id === selectedClip.id ? { ...clip, ...patch } : clip));
  };

  const removeClip = (clipId) => {
    setClips((items) => items.filter((clip) => clip.id !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const filteredClips = useMemo(() => clips.filter((clip) => clip.name.toLowerCase().includes(search.toLowerCase())), [clips, search]);
  const currentPreviewUrl = isRecording ? null : (recordingUrl || selectedClip?.url);

  const renderStudio = () => (
    <main className="workspace studio-workspace">
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">استوديو التسجيل</div>
          <h1>سجّل فكرتك كما تراها</h1>
          <p>كل ما تحتاجه لشرح واضح، من أول لقطة حتى الفيديو النهائي.</p>
        </div>
        <div className="heading-actions">
          <button className="ghost-button" onClick={() => setIsSourcePickerOpen(true)}><Monitor size={16} /> اختيار المصدر</button>
          <button className="primary-button" onClick={startRecording} disabled={isStarting}>
            {isRecording ? <Square size={16} fill="currentColor" /> : <ScreenShare size={16} />}
            {isStarting ? 'جارٍ التجهيز…' : isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
          </button>
        </div>
      </div>

      <div className="studio-grid">
        <section className="preview-card panel">
          <div className="preview-topbar">
            <div className="preview-meta"><span className={`status-dot ${isRecording ? 'live' : ''}`} /> {isRecording ? 'REC · تسجيل مباشر' : 'معاينة الاستوديو'}</div>
            <div className="preview-tools"><span>{project.ratio}</span><span>{project.quality}</span><button className="icon-button"><MoreHorizontal size={17} /></button></div>
          </div>
          <div className={`preview-stage ratio-${project.ratio.replace(':', '-')}`}>
            {currentPreviewUrl ? <video src={currentPreviewUrl} controls={!isRecording} autoPlay={isRecording} muted className="preview-video" /> : (
              <>
                {activeSource?.thumbnail ? <img src={activeSource.thumbnail} alt="مصدر التسجيل" className="source-backdrop" /> : <div className="abstract-backdrop" />}
                <div className="preview-center">
                  <div className="preview-mark"><ScreenShare size={30} strokeWidth={1.5} /></div>
                  <strong>{activeSource?.name || 'اختر شاشة أو نافذة للمعاينة'}</strong>
                  <span>سيتوقف الفيديو هنا مؤقتًا أثناء تجهيز اللقطة</span>
                </div>
              </>
            )}
            {isRecording && <div className="recording-pill"><span className="recording-dot" /> {formatTime(elapsed)}</div>}
            {cameraEnabled && <div className="camera-bubble"><Camera size={19} /><span>الكاميرا مفعلة</span></div>}
          </div>
          <div className="preview-footer">
            <div className="selected-source"><span className="source-icon"><Monitor size={15} /></span><div><strong>{activeSource?.name || 'لم يتم اختيار المصدر'}</strong><small>{activeSource ? 'مصدر الشاشة الحالي' : 'انقر لاختيار الشاشة أو النافذة'}</small></div></div>
            <button className="small-button" onClick={() => setIsSourcePickerOpen(true)}>تغيير المصدر <ChevronDown size={14} /></button>
          </div>
        </section>

        <aside className="record-controls panel">
          <div className="panel-heading"><div><div className="eyebrow">المشهد النشط</div><h2>{activeScene?.name}</h2></div><span className="shortcut-key">{activeScene?.shortcut}</span></div>
          <div className="control-stack">
            <ControlRow icon={<ScreenShare size={17} />} label="الشاشة" description="تسجيل الشاشة أو النافذة" active={Boolean(selectedSourceId)} onClick={() => setIsSourcePickerOpen(true)} trailing={<ChevronDown size={15} />} />
            <ControlRow icon={<Camera size={17} />} label="الكاميرا" description={cameraEnabled ? 'الخلفية: تمويه ناعم' : 'أضف صورتك إلى الشرح'} active={cameraEnabled} onClick={() => { setCameraEnabled((value) => !value); setCurrentScene({ camera: !cameraEnabled }); }} trailing={<Toggle active={cameraEnabled} />} />
            <ControlRow icon={<Mic size={17} />} label="الميكروفون" description="صوت واضح مع تنقية تلقائية" active={micEnabled} onClick={() => setMicEnabled((value) => !value)} trailing={<Toggle active={micEnabled} />} />
            <ControlRow icon={<Volume2 size={17} />} label="صوت الجهاز" description="التقاط أصوات النظام" active={systemAudioEnabled} onClick={() => setSystemAudioEnabled((value) => !value)} trailing={<Toggle active={systemAudioEnabled} />} />
          </div>
          <div className="settings-divider" />
          <div className="control-setting"><span>نسبة الشاشة</span><div className="segmented small">{['16:9', '9:16', '1:1'].map((ratio) => <button key={ratio} className={project.ratio === ratio ? 'active' : ''} onClick={() => setProject((current) => ({ ...current, ratio }))}>{ratio}</button>)}</div></div>
          <div className="control-setting"><span>الجودة</span><select value={project.quality} onChange={(event) => setProject((current) => ({ ...current, quality: event.target.value }))}><option>1440p</option><option>1080p</option><option>720p</option></select></div>
          <button className={`record-button ${isRecording ? 'stop' : ''}`} onClick={startRecording} disabled={isStarting}><span className="record-icon">{isRecording ? <Square size={19} fill="currentColor" /> : <span />}</span>{isRecording ? 'إيقاف وحفظ التسجيل' : 'بدء التسجيل'}</button>
          <div className="record-hint"><Keyboard size={14} /> اختصار عالمي: <b>Ctrl + Shift + R</b></div>
        </aside>
      </div>

      <section className="scenes-section">
        <div className="section-heading"><div><div className="eyebrow">سير العمل</div><h2>المشاهد</h2><p>بدّل بين إعدادات جاهزة أثناء التسجيل باستخدام F1 وF2 وF3.</p></div><button className="ghost-button" onClick={addScene}><Plus size={16} /> إضافة مشهد</button></div>
        <div className="scene-grid">
          {scenes.map((scene) => <SceneCard key={scene.id} scene={scene} active={scene.id === activeSceneId} onClick={() => setActiveSceneId(scene.id)} onDelete={() => deleteScene(scene.id)} />)}
          <button className="new-scene-card" onClick={addScene}><Plus size={22} /><strong>أضف مشهدًا جديدًا</strong><span>إعداد مخصص للمحتوى القادم</span></button>
        </div>
      </section>
    </main>
  );

  const renderEditor = () => (
    <main className="workspace editor-workspace">
      <div className="workspace-heading">
        <div><div className="eyebrow">المحرر المدمج</div><h1>رتّب القصة، ثم انشرها</h1><p>قصّ الصمت، أضف التكبير، وراجع النتيجة قبل التصدير.</p></div>
        <div className="heading-actions"><button className="ghost-button" onClick={saveProject}><Save size={16} /> {projectSaved ? 'تم الحفظ' : 'حفظ المشروع'}</button><button className="primary-button" onClick={exportClip}><Download size={16} /> تصدير WebM</button></div>
      </div>
      <div className="editor-top-grid">
        <section className="editor-preview panel"><div className="preview-topbar"><div className="preview-meta"><Film size={16} /> معاينة المقطع</div><div className="preview-tools"><button className="icon-button"><Undo2 size={16} /></button><button className="icon-button"><Redo2 size={16} /></button><span>{zoom}%</span></div></div><div className="editor-stage">{selectedClip?.url ? <video src={selectedClip.url} controls className="preview-video" /> : <div className="empty-editor"><Film size={28} /><strong>لا توجد مقاطع بعد</strong><span>سجّل مقطعًا من الاستوديو وسيظهر هنا مباشرة.</span><button className="small-button" onClick={() => setActiveView('studio')}>العودة إلى الاستوديو <ArrowLeft size={14} /></button></div>}</div><div className="editor-toolbar"><button><Scissors size={15} /> قص</button><button><ZoomIn size={15} /> تكبير</button><button><WandSparkles size={15} /> حذف الصمت</button><button><Sparkles size={15} /> انتقال</button><div className="toolbar-spacer" /><button onClick={() => setZoom((value) => Math.max(50, value - 10))}>−</button><button onClick={() => setZoom((value) => Math.min(150, value + 10))}>+</button></div></section>
        <aside className="inspector panel"><div className="panel-heading"><div><div className="eyebrow">خصائص المقطع</div><h2>{selectedClip?.name || 'لم تختر مقطعًا'}</h2></div><SlidersHorizontal size={18} className="muted-icon" /></div>{selectedClip ? <><div className="inspector-field"><label>اسم المقطع</label><input value={selectedClip.name} onChange={(event) => updateClip({ name: event.target.value })} /></div><div className="inspector-field"><label>بداية القص <b>{formatTime(selectedClip.trimStart)}</b></label><input type="range" min="0" max={Math.max(selectedClip.duration - 1, 1)} step="1" value={selectedClip.trimStart} onChange={(event) => updateClip({ trimStart: Number(event.target.value) })} /></div><div className="inspector-field"><label>نهاية القص <b>{formatTime(selectedClip.trimEnd)}</b></label><input type="range" min="1" max={selectedClip.duration} step="1" value={selectedClip.trimEnd} onChange={(event) => updateClip({ trimEnd: Number(event.target.value) })} /></div><div className="inspector-note"><Sparkles size={15} /><span>القص التلقائي للصمت متاح كبنية جاهزة للتفعيل مع محرك معالجة الفيديو.</span></div><button className="danger-button" onClick={() => removeClip(selectedClip.id)}><Trash2 size={15} /> حذف المقطع</button></> : <div className="inspector-empty">اختر مقطعًا من الخط الزمني لعرض خصائصه.</div>}</aside>
      </div>
      <section className="timeline-panel panel"><div className="timeline-heading"><div><div className="eyebrow">الخط الزمني</div><h2>{clips.length ? `${clips.length} مقاطع في المشروع` : 'ابدأ من هنا'}</h2></div><div className="timeline-actions"><button className="icon-button"><Upload size={16} /></button><button className="icon-button"><Grid2X2 size={16} /></button></div></div><div className="timeline-ruler"><span>00:00</span><span>00:10</span><span>00:20</span><span>00:30</span><span>00:40</span><span>00:50</span><span>01:00</span></div><div className="timeline-track"><div className="track-label"><Film size={15} /> فيديو</div><div className="track-content">{filteredClips.length ? filteredClips.map((clip) => <button key={clip.id} className={`clip-block ${selectedClipId === clip.id ? 'selected' : ''}`} style={{ width: `${Math.max(150, Math.min(580, clip.duration * 14))}px` }} onClick={() => setSelectedClipId(clip.id)}><span>{clip.name}</span><small>{formatTime(clip.duration)}</small></button>) : <div className="track-empty">ستظهر مقاطع التسجيل هنا</div>}</div></div><div className="timeline-track muted-track"><div className="track-label"><MousePointer2 size={15} /> المؤشر</div><div className="track-content"><div className="cursor-strip"><span>تتبع المؤشر وتكبيره تلقائيًا</span><Check size={14} /></div></div></div></section>
    </main>
  );

  const renderProjects = () => (
    <main className="workspace simple-workspace"><div className="workspace-heading"><div><div className="eyebrow">المشاريع</div><h1>كل شروحاتك في مكان واحد</h1><p>احفظ العمل كملف Capture واستكمله عندما تريد.</p></div><div className="heading-actions"><button className="ghost-button" onClick={openProject}><FolderOpen size={16} /> فتح مشروع</button><button className="primary-button" onClick={saveProject}><Plus size={16} /> مشروع جديد</button></div></div><section className="project-list panel"><div className="list-heading"><div className="search-field"><span>⌕</span><input placeholder="ابحث في المشاريع" value={search} onChange={(event) => setSearch(event.target.value)} /></div><span className="muted-text">آخر المشاريع</span></div><div className="project-row active-row"><div className="project-thumb"><Film size={22} /></div><div className="project-info"><strong>{project.name}</strong><span>تم التحديث منذ لحظات · {clips.length} مقاطع</span></div><div className="project-format">{project.ratio}</div><button className="small-button" onClick={() => setActiveView('studio')}>فتح <ArrowLeft size={14} /></button></div><div className="project-empty"><FolderOpen size={24} /><strong>يمكنك فتح ملف مشروع محفوظ</strong><span>ملفات .capture.json تحفظ المشاهد والإعدادات للعودة إليها لاحقًا.</span><button className="ghost-button" onClick={openProject}>استيراد مشروع</button></div></section></main>
  );

  const renderSettings = () => (
    <main className="workspace simple-workspace"><div className="workspace-heading"><div><div className="eyebrow">الإعدادات</div><h1>اضبط Capture على طريقتك</h1><p>خيارات بسيطة لتبدأ التسجيل بسرعة وتحصل على نتيجة ثابتة.</p></div></div><section className="settings-layout"><div className="settings-nav panel"><button className="active"><Settings size={16} /> عام</button><button><Monitor size={16} /> التسجيل</button><button><Volume2 size={16} /> الصوت</button><button><Keyboard size={16} /> الاختصارات</button></div><div className="settings-content panel"><div className="settings-title"><Settings size={18} /><div><h2>الإعدادات العامة</h2><p>تفضيلات المشروع والتصدير الافتراضية.</p></div></div><div className="preference-row"><div><strong>اسم المشروع الافتراضي</strong><span>يُستخدم عند إنشاء مشروع جديد.</span></div><input value={project.name} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value }))} /></div><div className="preference-row"><div><strong>معدل الإطارات</strong><span>معدل ثابت مناسب لشروحات الشاشة.</span></div><select value={project.fps} onChange={(event) => setProject((current) => ({ ...current, fps: Number(event.target.value) }))}><option value="30">30 إطارًا/ث</option><option value="24">24 إطارًا/ث</option><option value="15">15 إطارًا/ث</option></select></div><div className="preference-row"><div><strong>حفظ نسخة احتياطية محلية</strong><span>احتفظ بآخر إعدادات المشروع على هذا الجهاز.</span></div><Toggle active /></div><div className="preference-row"><div><strong>واجهة عربية</strong><span>اللغة العربية مفعلة افتراضيًا في Capture.</span></div><span className="language-badge">العربية <Check size={14} /></span></div></div></section></main>
  );

  return (
    <div className="app-shell">
      <header className="topbar"><div className="brand"><div className="brand-symbol"><span /></div><div><strong>Capture</strong><small>استوديو الشروحات</small></div></div><nav className="main-nav">{[['studio', <LayoutDashboard size={16} />, 'الاستوديو'], ['editor', <Film size={16} />, 'المحرر'], ['projects', <FolderOpen size={16} />, 'المشاريع'], ['settings', <Settings size={16} />, 'الإعدادات']].map(([key, icon, label]) => <button key={key} className={activeView === key ? 'active' : ''} onClick={() => setActiveView(key)}>{icon}{label}</button>)}</nav><div className="topbar-actions"><div className={`notice ${notice.type}`}><span className="notice-dot" />{notice.text}</div><button className="icon-button help" title="مساعدة"><CircleHelp size={18} /></button><div className="project-menu-wrap"><button className="project-menu" onClick={() => setIsProjectMenuOpen((value) => !value)}><span className="project-avatar">{project.name.slice(0, 1)}</span><span>{project.name}</span><ChevronDown size={14} /></button>{isProjectMenuOpen && <div className="dropdown"><button onClick={saveProject}><Save size={15} /> حفظ المشروع</button><button onClick={openProject}><FolderOpen size={15} /> فتح مشروع</button></div>}</div></div></header>
      <div className="app-body"><aside className="sidebar"><div className="sidebar-card"><div className="sidebar-card-top"><span className="live-indicator" /><span>جلسة جديدة</span></div><strong>{project.name}</strong><span className="sidebar-subtitle">{scenes.length} مشاهد · {clips.length} مقاطع</span><button className="sidebar-start" onClick={startRecording}>{isRecording ? <Square size={15} fill="currentColor" /> : <ScreenShare size={15} />}{isRecording ? 'إيقاف التسجيل' : 'ابدأ الآن'}</button></div><div className="sidebar-section"><div className="sidebar-label">المشاهد <button onClick={addScene}><Plus size={14} /></button></div><div className="sidebar-scenes">{scenes.map((scene) => <button className={`sidebar-scene ${activeSceneId === scene.id ? 'active' : ''}`} key={scene.id} onClick={() => { setActiveSceneId(scene.id); setActiveView('studio'); }}><span className="scene-mini-icon">{scene.camera ? <Camera size={14} /> : <Monitor size={14} />}</span><span>{scene.name}</span><kbd>{scene.shortcut}</kbd></button>)}</div></div><div className="sidebar-section quick-section"><div className="sidebar-label">أدوات سريعة</div><button onClick={() => setMicEnabled((value) => !value)}><Mic size={15} /> الميكروفون <span className={micEnabled ? 'quick-status on' : 'quick-status'} /></button><button onClick={() => setCurrentScene({ zoom: !activeScene.zoom })}><ZoomIn size={15} /> تكبير ذكي <span className={activeScene.zoom ? 'quick-status on' : 'quick-status'} /></button><button onClick={() => setCurrentScene({ cursor: !activeScene.cursor })}><MousePointer2 size={15} /> تتبع المؤشر <span className={activeScene.cursor ? 'quick-status on' : 'quick-status'} /></button></div><div className="sidebar-footer"><div><LockKeyhole size={14} /><span>المعالجة محلية</span></div><small>لا يتم رفع تسجيلاتك إلى أي خادم.</small></div></aside>{activeView === 'studio' && renderStudio()}{activeView === 'editor' && renderEditor()}{activeView === 'projects' && renderProjects()}{activeView === 'settings' && renderSettings()}</div>
      {isSourcePickerOpen && <SourcePicker sources={sources} selectedSourceId={selectedSourceId} onSelect={selectSource} onRefresh={loadSources} onClose={() => setIsSourcePickerOpen(false)} />}
    </div>
  );
}

function ControlRow({ icon, label, description, active, onClick, trailing }) {
  return <button className={`control-row ${active ? 'active' : ''}`} onClick={onClick}><span className="control-icon">{icon}</span><span className="control-copy"><strong>{label}</strong><small>{description}</small></span><span className="control-trailing">{trailing}</span></button>;
}

function Toggle({ active = false }) {
  return <span className={`toggle ${active ? 'active' : ''}`}><span /></span>;
}

function SceneCard({ scene, active, onClick, onDelete }) {
  return <button className={`scene-card ${active ? 'active' : ''}`} onClick={onClick}><div className={`scene-visual ${scene.camera ? 'camera-scene' : ''}`}><div className="scene-visual-grid" /><span className="scene-shortcut">{scene.shortcut}</span><span className="scene-type">{scene.camera ? <Camera size={13} /> : <Monitor size={13} />}</span></div><div className="scene-card-meta"><div><strong>{scene.name}</strong><span>{scene.camera ? 'كاميرا + شاشة' : scene.zoom ? 'شاشة + تكبير ذكي' : 'تسجيل الشاشة'}</span></div><button className="scene-more" onClick={(event) => { event.stopPropagation(); onDelete(); }}><MoreHorizontal size={16} /></button></div></button>;
}

function SourcePicker({ sources, selectedSourceId, onSelect, onRefresh, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="source-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow">مصدر الالتقاط</div><h2>اختر ما تريد تسجيله</h2><p>يمكنك تسجيل شاشة كاملة أو نافذة تطبيق محددة.</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{sources.length ? <div className="source-grid">{sources.map((source) => <button className={`source-option ${source.id === selectedSourceId ? 'selected' : ''}`} key={source.id} onClick={() => onSelect(source)}><div className="source-thumb">{source.thumbnail ? <img src={source.thumbnail} alt="" /> : <Monitor size={26} />}{source.id === selectedSourceId && <span className="source-check"><Check size={14} /></span>}</div><div><strong>{source.name}</strong><span>{source.type === 'screen' ? 'شاشة كاملة' : 'نافذة تطبيق'}</span></div></button>)}</div> : <div className="source-empty"><Monitor size={30} /><strong>لم تظهر مصادر بعد</strong><span>اضغط تحديث للوصول إلى الشاشات والنوافذ المتاحة.</span></div>}<div className="modal-footer"><button className="ghost-button" onClick={onRefresh}><RefreshCw size={15} /> تحديث المصادر</button><button className="primary-button" disabled={!selectedSourceId} onClick={onClose}>تأكيد المصدر <ArrowLeft size={15} /></button></div></section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
