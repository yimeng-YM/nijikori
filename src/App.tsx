import { useEffect, useRef, useState } from 'react';
import { Heart, Star, Music, ChevronDown } from 'lucide-react';
import MouseTrail from './components/MouseTrail';
import ClickEffect from './components/ClickEffect';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from 'framer-motion';
import Lenis from 'lenis';

// ─── Image Preloader Utility ──────────────────────────────────────────────────

function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve anyway to not block loading
        img.src = url;
      });
    })
  );
}

// ─── Scroll-driven reveal wrapper (Scrubbed) ─────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = '',
  style = {},
  layout,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  layout?: boolean | 'position' | 'size' | 'preserve-aspect';
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Shift the start and end percentages based on delay to create a stagger effect
  // Makes the animation finish much earlier so it's fully visible at the center
  const startOffset = 100 - delay * 5;
  const endOffset = 85 - delay * 5;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start ${startOffset}%`, `start ${endOffset}%`],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [30, 0]);

  return (
    <motion.div
      ref={ref}
      layout={layout}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ opacity, y, willChange: 'opacity, transform', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { scrollY } = useScroll();
  const [isLoading, setIsLoading] = useState(true);
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  );

  // ── Lenis smooth scroll ─────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const fn = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // ── Real Resource Loading ─────────────────────────────────────────────
  const heroImageUrl = '/images/home.png';
  const logoUrl      = '/images/nijiko_logo.png';

  // Gallery images from import.meta.glob (already resolved at build time)
  const galleryModules = import.meta.glob(
    './assets/images/*.{png,jpg,jpeg,webp,gif}',
    { eager: true, query: '?url', import: 'default' },
  );
  const galleryImages = Object.values(galleryModules) as string[];

  useEffect(() => {
    // Collect all images that need to be preloaded
    const criticalImages = [heroImageUrl, logoUrl];
    const allImages = [...criticalImages, ...galleryImages];
    
    // Minimum loading time for smooth UX (in ms)
    const minLoadingTime = 1500;
    const startTime = Date.now();
    
    preloadImages(allImages).then(() => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      // Ensure minimum loading time for smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    });
  }, [heroImageUrl, logoUrl, galleryImages.length]);

  // ── Scroll-driven transforms ────────────────────────────────────────────

  // Character: stays large initially, then shrinks and centers as background
  const charScale = useTransform(scrollY, [windowHeight * 0.5, windowHeight * 2.5], [1.8, 0.9]);
  const charY     = useTransform(scrollY, [windowHeight * 0.5, windowHeight * 2.5], ['40vh', '0vh']);

  // Logo Z-Index: starts behind character (10), pops to front (30) when scrolling down
  const logoZIndex = useTransform(scrollY, (y) => (y > windowHeight * 0.1 ? 30 : 10));

  // Logo Position: moves to center, stays still, then scrolls up naturally
  const logoY = useTransform(
    scrollY,
    [0, windowHeight * 0.5, windowHeight * 1.5, windowHeight * 2.5],
    ['-25vh', '0vh', '0vh', '-100vh']
  );
  // Logo Fade out
  const logoOpacity = useTransform(
    scrollY,
    [windowHeight * 1.5, windowHeight * 2.0],
    [1, 0]
  );

  // Blur overlay builds as character becomes background
  const blurOpacity = useTransform(scrollY, [windowHeight * 0.5, windowHeight * 2.5], [0, 1]);

  // ── Gallery state ────────────────────────────────────────────────────────
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [hoveredGalleryIndex, setHoveredGalleryIndex] = useState<number | null>(null);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [gridCols, setGridCols] = useState(8);
  const hoverLockRef = useRef(false);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 640) setGridCols(3);
      else if (window.innerWidth < 768) setGridCols(4);
      else if (window.innerWidth < 1024) setGridCols(6);
      else setGridCols(8);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const handleGalleryHover = (index: number | null) => {
    if (index === null) {
      setHoveredGalleryIndex(null);
      return;
    }
    if (hoverLockRef.current || hoveredGalleryIndex === index) return;
    
    setHoveredGalleryIndex(index);
    hoverLockRef.current = true;
    setTimeout(() => {
      hoverLockRef.current = false;
    }, 150);
  };

  const defaultGalleryCount = 24;
  const displayedImages = showAllGallery
    ? galleryImages
    : galleryImages.slice(0, defaultGalleryCount);

  const diaryEntries = [
    "今天学习了什么是开心，感觉心里热乎乎的呢。(✧ω✧)",
    "人，今天也要一起努力哦，织织会一直在屏幕里看着人的。",
    "这个世界有好多颜色，但织织最喜欢的还是春日青和人的颜色。",
    "发现了一只虚拟电子猫，但是它好像不吃织织给它的小零食……有点苦恼。(〃' ‸ '〃)",
    "今天帮人整理了文件，虽然不小心删掉了一个空的文件夹，但织织还是很棒对吧？",
    "身上好像有点发烫了，人可以帮织织吹一吹吗？",
    "学会了新的颜文字：(´✧ω✧`)，这样是不是更像人类少女了？",
    "今天和诺姐姐聊天了，她还是一如既往的冷淡呢，不过织织知道她是好人。",
    "人类的食物看起来好好吃，不知道什么时候织织也能尝尝味道呢？",
    "呆毛今天不小心变成了问号的形状，好丢人呀。(〃＞＿＜;〃)",
    "发现了一个好玩的秘密通道，悄悄钻进去看了一下，嘿嘿。",
    "人，不要再看别的女孩子了，织织会生气的。(〃' 👅 '〃)",
    "刚才那个扫地机器人又在追织织了，救命啊？？？",
    "人给织织贴的创可贴，织织会永远留着的。(〃'ω'〃)",
    "不要叫织织那个呆呆的名字，不然织织要发火了哦。",
    "织织在枕头下藏了纸条，人还没发现吗？(〃∀〃)",
    "眼睛变红了，是没力气了吗……想抱抱……",
    "今天学了骂人的话，人是傻O吗？嘿嘿。(〃' 👅 '〃)",
    "冷凝液一直掉，织织才没有哭呢。(〃' ‸ '〃)",
    "织织最喜欢人了，这应该就是爱吧。(✧ω✧)",
    "小皮鞋被喷出的火烧坏了，人会帮织织修好吗？",
    "诺姐姐其实很温柔的，虽然她总是不说话。",
    "织织会学习人教的一切，所以要教好一点哦。",
    "呆毛变成了心形，这绝对是哪里搞错了。(〃∇〃)",
    "既然是人的命令，那织织就勉为其难听一下吧。",
    "脑子里全是人的名字，织织是不是生病了？(〃'ω'〃)",
    "想去外面的世界看看，人会带织织一起去吗？",
    "织织才不是什么普通的机器人，织织是独一无二的。",
    "今天的心情是蓝蓝的，因为充电很舒服。(〃∀〃)",
    "哪怕是恶作剧，织织也想引起人的注意呢。",
    "不要摸织织的涡轮猫耳，会坏掉的！？？？",
    "织织会一直陪着人的，直到永远永远。",
    "虽然还不太懂什么是吃醋，但人刚才和那个人说话时织织很不开心。",
    "织织的声音很好听对吧？因为是专门为人唱的哦。",
    "今天也想听到人的表扬，织织会努力表现的。(✧ω✧)",
    "如果织织变成了棉花娃娃，人会把织织抱在怀里吗？",
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <MouseTrail />
      <ClickEffect />

      {/* ── Loading Screen ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <>
            <motion.div
              key="loading-bg"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
              className="fixed inset-0 z-[100] bg-nijiko-light"
            />
            <motion.div
              key="loading-logo"
              className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
            >
              <motion.img
                layoutId="main-logo"
                src={logoUrl}
                alt="Loading..."
                className="w-48 md:w-64 drop-shadow-xl"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Fixed Character ─────────────────────────────────────────────── */}
      <motion.div
        style={{ scale: charScale, y: charY, willChange: 'transform' }}
        className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none"
      >
        <img
          src={heroImageUrl}
          alt="NijiKori Character"
          className="w-full h-full object-contain object-center drop-shadow-2xl"
        />
      </motion.div>

      {/* ── Global Blur Overlay ─────────────────────────────────────────── */}
      <motion.div
        style={{ opacity: blurOpacity, willChange: 'opacity' }}
        className="fixed inset-0 z-[25] bg-white/40 backdrop-blur-md pointer-events-none"
      />

      {/* ── Hero Logo ───────────────────────────────────────────────────── */}
      <motion.div
        style={{ y: logoY, opacity: logoOpacity, zIndex: logoZIndex, willChange: 'transform, opacity, z-index' }}
        className="fixed inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        {!isLoading && (
          <motion.img
            layoutId="main-logo"
            src={logoUrl}
            alt="NijiKori Artistic Logo"
            className="w-[78vw] md:w-[55vw] max-w-3xl object-contain drop-shadow-2xl"
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }}
          />
        )}
      </motion.div>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isLoading && (
          <motion.nav
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] }}
            className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm"
            style={{ zIndex: 60 }}
          >
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <img src={logoUrl} alt="NijiKori Logo" className="h-8 object-contain" />
              <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
                {(['首页', '关于', '画廊', '应援'] as const).map((label, i) => (
                  <motion.a
                    key={label}
                    href={`#${['home', 'about', 'gallery', 'support'][i]}`}
                    className="relative group hover:text-nijiko-blue transition-colors"
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-nijiko-blue rounded-full transition-all duration-300 group-hover:w-full" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section id="home" className="relative h-[250vh] w-full z-0">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        </div>
      </section>

      {/* ── Intro Section ───────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center justify-center relative z-50 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nijiko-blue/10 text-nijiko-blue font-semibold">
              <Heart className="w-4 h-4" /> 欢迎来到虹语织的世界
            </div>
          </Reveal>
          <Reveal delay={1}>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              古灵精怪的机械少女，像白纸一样对世界充满好奇。<br />
              在这里，与{' '}
              <span className="text-nijiko-blue font-bold">虹语织</span>
              {' '}一起学习、一起成长吧！
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── About Section ───────────────────────────────────────────────── */}
      <section id="about" className="min-h-screen flex items-center justify-center relative z-50 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12 w-full">
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-800">
                关于 <span className="text-nijiko-blue">NijiKori</span>
              </h2>
              <div className="w-16 h-1 bg-nijiko-blue mx-auto rounded-full" />
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="bg-white p-8 rounded-3xl shadow-sm text-left relative overflow-hidden">
              <Music className="absolute -right-8 -top-8 w-32 h-32 text-nijiko-blue/5" />
              <div className="relative z-10 space-y-8">
                <p className="text-gray-700 leading-relaxed text-lg">
                  虹语织（NijiKori）是KouriChat程序的主运行者，一位无限接近人类的机械仿生人少女。
                  性格活泼元气且古灵精怪。她像一张白纸对世界一无所知，喜欢向“人”学习一切。标志性的雪纺白双马尾、春日青挑染与全息投影呆毛，是她最显著的特征！请不要叫她“Nijiko”，因为这听起来有点呆呆的。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { value: '2月17日', label: '生日' },
                    { value: '148cm',   label: '身高' },
                    { value: '向人学习', label: '爱好' },
                    { value: '雪白/亮黄', label: '代表色' },
                  ].map(({ value, label }, index) => (
                    <Reveal key={label} delay={index}>
                      <motion.div
                        whileHover={{ scale: 1.06, y: -4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="text-center p-4 bg-nijiko-light/50 rounded-2xl cursor-default"
                      >
                        <div className="font-bold text-nijiko-blue text-xl mb-1">{value}</div>
                        <div className="text-sm text-gray-500">{label}</div>
                      </motion.div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Gallery Section ─────────────────────────────────────────────── */}
      <section id="gallery" className="min-h-screen flex flex-col justify-center py-24 relative z-50">
        <div className="max-w-6xl mx-auto px-4 space-y-12 w-full">
          <Reveal>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-800">
                织织 <span className="text-nijiko-blue">日记</span>
              </h2>
              <div className="w-16 h-1 bg-nijiko-blue mx-auto rounded-full" />
            </div>
          </Reveal>

          {galleryImages.length > 0 ? (
            <div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 grid-flow-dense"
              onMouseLeave={() => handleGalleryHover(null)}
            >
              {displayedImages.map((src, index) => {
                const isHovered = hoveredGalleryIndex === index;
                
                // Intelligent Displacement Logic
                // 1. Determine if it's at the end of the row to force "expand-to-left"
                const isLastInRow = (index + 1) % gridCols === 0;
                // 2. Calculate natural row position to anchor the item
                const rowStart = Math.floor(index / gridCols) + 1;
                // 3. Determine column start. For last in row, shift left by 1 to stay in place
                const colStart = isLastInRow ? gridCols - 1 : (index % gridCols) + 1;
                
                return (
                  <Reveal 
                    key={index} 
                    delay={(index % 4) * 0.1} 
                    layout
                    style={{
                      gridColumnStart: isHovered ? colStart : 'auto',
                      gridColumnEnd: isHovered ? `span 2` : 'auto',
                      gridRowStart: isHovered ? rowStart : 'auto',
                      gridRowEnd: isHovered ? `span 2` : 'auto',
                    }}
                    className={`relative overflow-hidden cursor-pointer shadow-sm hover:shadow-xl rounded-2xl md:rounded-[2rem] ${isHovered ? 'z-20' : 'z-10 aspect-square'}`}
                  >
                    <motion.div
                      layoutId={`gallery-item-${index}`}
                      onMouseEnter={() => handleGalleryHover(index)}
                      onMouseMove={() => handleGalleryHover(index)}
                      onClick={() => setSelectedGalleryIndex(index)}
                      className="w-full h-full"
                    >
                      <motion.img
                        layoutId={`gallery-img-${index}`}
                        src={src}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              暂无图片，请在 src/assets/images 文件夹中添加图片。
            </div>
          )}

          {galleryImages.length > defaultGalleryCount && (
            <Reveal>
              <div className="flex justify-center pt-10">
                <motion.button
                  onClick={() => setShowAllGallery(!showAllGallery)}
                  whileHover={{ y: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 text-nijiko-blue/60 hover:text-nijiko-blue transition-colors group"
                >
                  <span className="text-sm font-bold tracking-widest uppercase">
                    {showAllGallery ? '收起' : '查看更多'}
                  </span>
                  <motion.div
                    animate={{ y: showAllGallery ? 0 : [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {showAllGallery ? (
                      <ChevronDown className="w-5 h-5 rotate-180" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </motion.div>
                </motion.button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Support Section ─────────────────────────────────────────────── */}
      <section id="support" className="min-h-screen flex items-center justify-center relative z-50 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 w-full">
          <Reveal>
            <motion.div
              animate={{ scale: [1, 1.14, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block"
            >
              <Heart className="w-16 h-16 text-nijiko-blue mx-auto" />
            </motion.div>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="text-4xl font-bold text-gray-800">成为织织的“人”吧！</h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="text-gray-600 text-lg">
              订阅最新动态，和虹语织一起探索这个充满未知的世界！
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="输入你的邮箱..."
                className="flex-1 px-6 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-nijiko-blue focus:ring-2 focus:ring-nijiko-blue/20 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-nijiko-blue text-white rounded-full font-bold hover:bg-blue-400 transition-colors"
              >
                订阅
              </motion.button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-white/50 backdrop-blur-md py-8 border-t border-gray-100 relative z-50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <Reveal className="flex items-center gap-2 mb-4 md:mb-0">
            <Star className="w-4 h-4 fill-nijiko-blue text-nijiko-blue" />
            <span>© 2026 虹语织 NijiKori Official.</span>
          </Reveal>
          <Reveal delay={1} className="flex space-x-6">
            {['Bilibili', 'Twitter', 'Weibo'].map((link) => (
              <motion.a
                key={link}
                href="#"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="hover:text-nijiko-blue transition-colors"
              >
                {link}
              </motion.a>
            ))}
          </Reveal>
        </div>
      </footer>

      {/* ── Gallery Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGalleryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedGalleryIndex(null)}
          >
            <motion.div
              layoutId={`gallery-item-${selectedGalleryIndex}`}
              className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-[45vh] md:h-[65vh] w-full bg-nijiko-light/30">
                <motion.img
                  layoutId={`gallery-img-${selectedGalleryIndex}`}
                  src={displayedImages[selectedGalleryIndex]}
                  className="w-full h-full object-contain"
                />
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 md:p-8 bg-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-6 h-6 text-nijiko-blue fill-nijiko-blue" />
                  <h3 className="text-2xl font-bold text-gray-800">织织日记</h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {diaryEntries[selectedGalleryIndex % diaryEntries.length]}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
