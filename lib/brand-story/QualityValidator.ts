export class QualityValidator {
  private sensitiveWords: string[];

  constructor(private config: any = {}) {
    this.config = {
      maxExaggerationScore: 3,
      minWordCount: 500,
      maxWordCount: 3000,
      requiredElements: ['场景', '情感', '产品价值'],
      ...config
    };

    this.sensitiveWords = [
      '政治', '宗教', '色情', '暴力', '歧视'
    ];
  }

  validate(content: string, options: any = {}): any {
    const rules = options.rules || ['noExaggeration', 'noSensitiveContent', 'toneConsistency', 'lengthCheck'];
    const issues: any[] = [];
    const passedRules: string[] = [];

    if (rules.includes('noExaggeration')) {
      const result = this._checkExaggeration(content);
      if (result.passed) passedRules.push('noExaggeration');
      else issues.push(...result.issues);
    }

    if (rules.includes('noSensitiveContent')) {
      const result = this._checkSensitiveContent(content);
      if (result.passed) passedRules.push('noSensitiveContent');
      else issues.push(...result.issues);
    }

    if (rules.includes('lengthCheck')) {
      const result = this._checkLength(content);
      if (result.passed) passedRules.push('lengthCheck');
      else issues.push(...result.issues);
    }

    return {
      passed: issues.length === 0,
      score: this._calculateScore(issues.length, rules.length),
      issues,
      passedRules,
      failedRules: rules.filter((r: string) => !passedRules.includes(r)),
      timestamp: new Date().toISOString()
    };
  }

  private _checkExaggeration(content: string) {
    const patterns = [
      { pattern: /最[\u4e00-\u9fa5]+的/g, level: 'high', desc: '使用"最"字极限词' },
      { pattern: /第一[\u4e00-\u9fa5]*/g, level: 'high', desc: '使用"第一"等排名词' },
      { pattern: /100%[\u4e00-\u9fa5]*/g, level: 'high', desc: '使用"100%"绝对化表述' },
      { pattern: /绝对[\u4e00-\u9fa5]+/g, level: 'medium', desc: '使用"绝对"等确定性词汇' },
    ];

    const issues: any[] = [];
    let score = 0;

    for (const { pattern, level, desc } of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        const s = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
        score += s * matches.length;
        issues.push({ type: 'exaggeration', level, description: desc, suggestion: '建议替换为更客观的表述' });
      }
    }

    return { passed: score <= this.config.maxExaggerationScore, issues, score };
  }

  private _checkSensitiveContent(content: string) {
    const issues: any[] = [];
    for (const word of this.sensitiveWords) {
      if (content.includes(word)) {
        issues.push({ type: 'sensitive', level: 'high', description: `包含敏感词汇: "${word}"`, suggestion: '请移除或替换敏感词汇' });
      }
    }
    return { passed: issues.length === 0, issues };
  }

  private _checkLength(content: string) {
    const issues: any[] = [];
    const wordCount = this._countWords(content);
    if (wordCount < this.config.minWordCount) {
      issues.push({ type: 'length', level: 'medium', description: `内容过短 (${wordCount}字)`, suggestion: '增加场景描写' });
    }
    if (wordCount > this.config.maxWordCount) {
      issues.push({ type: 'length', level: 'low', description: `内容较长 (${wordCount}字)`, suggestion: '考虑精简' });
    }
    return { passed: issues.length === 0, issues, wordCount };
  }

  private _calculateScore(issueCount: number, totalRules: number): number {
    if (issueCount === 0) return 100;
    return Math.max(100 - Math.min(issueCount * 15, 80), 20);
  }

  scoreContent(content: string, options: any = {}): any {
    const dimensions = {
      emotional: this._scoreEmotional(content),
      narrative: this._scoreNarrative(content),
      brand: this._scoreBrandFit(content, options.brandTone),
      readability: this._scoreReadability(content),
      compliance: this._scoreCompliance(content)
    };

    const weights = { emotional: 0.25, narrative: 0.2, brand: 0.2, readability: 0.2, compliance: 0.15 };
    const total = Object.entries(dimensions).reduce((sum, [key, dim]: [string, any]) => {
      return sum + dim.score * (weights[key as keyof typeof weights] || 0.2);
    }, 0);

    return {
      total: Math.round(total),
      dimensions,
      grade: total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F'
    };
  }

  private _scoreEmotional(content: string) {
    let score = 60;
    const words = ['感动', '温暖', '幸福', '期待', '惊喜', '满足', '安心', '自信', '自由', '快乐'];
    const found = words.filter(w => content.includes(w)).length;
    score += Math.min(found * 5, 25);
    if (content.includes('你') || content.includes('您')) score += 5;
    return { score: Math.min(score, 100), label: '情感感染力' };
  }

  private _scoreNarrative(content: string) {
    let score = 50;
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length >= 5) score += 15;
    else if (paragraphs.length >= 3) score += 8;
    if (content.includes('#')) score += 10;
    const connectors = ['因此', '所以', '然而', '但是', '于是', '后来', '最终'];
    const connectorCount = connectors.filter(c => content.includes(c)).length;
    score += Math.min(connectorCount * 3, 15);
    return { score: Math.min(score, 100), label: '叙事完整性' };
  }

  private _scoreBrandFit(content: string, brandTone?: string) {
    let score = 65;
    const toneMap: Record<string, string[]> = {
      warm_professional: ['专业', '品质', '贴心', '关怀', '温暖', '可靠'],
      passionate: ['激情', '突破', '挑战', '力量'],
      elegant: ['优雅', '品味', '格调', '精致'],
      friendly: ['轻松', '有趣', '简单', '快乐'],
    };
    const keywords = toneMap[brandTone || 'warm_professional'] || toneMap.warm_professional;
    const found = keywords.filter(k => content.includes(k)).length;
    score += Math.min(found * 6, 25);
    return { score: Math.min(score, 100), label: '品牌契合度' };
  }

  private _scoreReadability(content: string) {
    let score = 70;
    if (content.includes('\n\n')) score += 5;
    if (content.match(/[#*·•—]/)) score += 5;
    return { score: Math.min(score, 100), label: '可读性' };
  }

  private _scoreCompliance(content: string) {
    const validation = this.validate(content, { rules: ['noExaggeration', 'noSensitiveContent'] });
    let score = 90;
    if (!validation.passed) {
      const highIssues = validation.issues.filter((i: any) => i.level === 'high').length;
      score -= highIssues * 20;
    }
    return { score: Math.max(score, 20), label: '合规性' };
  }

  private _countWords(content: string): number {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }
}
