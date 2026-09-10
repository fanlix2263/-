import silverDragonArt from '../assets/images/silver_dragon_moon_1788970146396.jpg';
import inkDragonArt from '../assets/images/ink_dragon_clouds_1788970425003.jpg';
import cyberDragonArt from '../assets/images/cyber_dragon_neon_1788970444885.jpg';

export interface PresetPalette {
  id: string;
  name: string;
  category: string;
  colors: string[];
  description: string;
}

export interface PresetImage {
  id: string;
  title: string;
  style: string;
  src: string;
}

export const PRESET_IMAGES: PresetImage[] = [
  {
    id: 'cyber-dragon',
    title: '赛博未来霓虹',
    style: '高饱和冷暖对比 (Cyber Neon)',
    src: cyberDragonArt,
  },
  {
    id: 'silver-moon',
    title: '银龙破云明月',
    style: '深海夜空冷蓝 (Deep Night Sky)',
    src: silverDragonArt,
  },
  {
    id: 'ink-clouds',
    title: '水墨云山写意',
    style: '国风水墨素雅 (Ink & Sepia)',
    src: inkDragonArt,
  },
];

export const PRESET_PALETTES: PresetPalette[] = [
  {
    id: 'preset-nordic',
    name: '北欧极简冰川 (Nordic Minimal)',
    category: '极简/现代',
    description: '低饱和青蓝与清冷岩石灰，营造高级开阔感',
    colors: ['#0F172A', '#334155', '#64748B', '#94A3B8', '#E2E8F0', '#F8FAFC'],
  },
  {
    id: 'preset-saas',
    name: '现代科技 SaaS (Modern Indigo)',
    category: '产品/UI',
    description: '经典的克莱因钴蓝与紫罗兰基底，UI产品首选',
    colors: ['#4F46E5', '#06B6D4', '#10B981', '#1E293B', '#F1F5F9'],
  },
  {
    id: 'preset-terracotta',
    name: '托斯卡纳暖陶 (Warm Terracotta)',
    category: '暖调/自然',
    description: '意大利红陶、橄榄木与烤杏仁色，温暖而醇厚',
    colors: ['#78350F', '#B45309', '#D97706', '#F59E0B', '#FDE68A', '#FFFBEB'],
  },
  {
    id: 'preset-cyber',
    name: '暗夜赛博霓虹 (Cyberpunk Glow)',
    category: '潮流/视觉',
    description: '电光品红与荧光湖青的暗色对撞',
    colors: ['#090A0F', '#1E1B4B', '#7C3AED', '#EC4899', '#06B6D4'],
  },
  {
    id: 'preset-wabisabi',
    name: '京都枯山水 (Kyoto Wabi-Sabi)',
    category: '东方/禅意',
    description: '苔藓绿、焦茶色与和纸灰白的静谧呼吸',
    colors: ['#292524', '#57534E', '#78716C', '#84A98C', '#CAD2C5'],
  },
  {
    id: 'preset-sunset',
    name: '加州暮色霞光 (Sunset Mirage)',
    category: '渐变/浪漫',
    description: '落日熔金至紫幕初升的柔美过渡',
    colors: ['#312E81', '#701A75', '#BE185D', '#F97316', '#FDE047'],
  },
  {
    id: 'preset-bauhaus',
    name: '包豪斯几何原色 (Bauhaus Classic)',
    category: '复古/艺术',
    description: '纯粹三原色与平衡黑白的现代主义致敬',
    colors: ['#18181B', '#DC2626', '#2563EB', '#FACC15', '#F4F4F5'],
  },
  {
    id: 'preset-forest',
    name: '冷杉雾林深境 (Misty Pine Forest)',
    category: '自然/森系',
    description: '深邃松针绿与清冽薄荷泉水',
    colors: ['#064E3B', '#047857', '#10B981', '#6EE7B7', '#D1FAE5'],
  },
];
