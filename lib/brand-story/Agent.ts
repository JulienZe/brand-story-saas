import { WorkflowEngine } from './WorkflowEngine';
import { PromptTemplate } from './PromptTemplate';
import { ContentGenerator } from './ContentGenerator';
import { QualityValidator } from './QualityValidator';

export interface BrandStoryInput {
  productInfo: {
    name: string;
    description: string;
    features?: string[];
    category?: string;
    competitors?: string;
  };
  brandPositioning?: {
    tone?: string;
    values?: string[];
    channels?: string[];
  };
  targetAudience?: {
    description?: string;
    demographics?: any;
    psychographics?: any;
  };
  options?: {
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    defaultTone?: string;
  };
}

export class BrandStoryAgent {
  private workflow: WorkflowEngine;
  private promptTemplate: PromptTemplate;
  private contentGenerator: ContentGenerator;
  private validator: QualityValidator;
  private config: any;

  constructor(configOverrides: any = {}) {
    this.config = {
      maxRetries: 3,
      defaultTone: 'warm_professional',
      outputFormat: 'markdown',
      ...configOverrides
    };

    this.workflow = new WorkflowEngine();
    this.promptTemplate = new PromptTemplate();
    this.contentGenerator = new ContentGenerator({
      provider: configOverrides?.provider || 'mock',
      apiKey: configOverrides?.apiKey,
      baseUrl: configOverrides?.baseUrl,
      model: configOverrides?.model,
    });
    this.validator = new QualityValidator();

    this._initializeWorkflow();
  }

  private _initializeWorkflow() {
    this.workflow
      .addStage('productAnalysis', {
        name: '产品价值分析',
        description: '深入分析产品功能特性，提炼核心价值主张',
        handler: this._analyzeProduct.bind(this),
      })
      .addStage('userInsight', {
        name: '用户需求洞察',
        description: '识别目标用户群体特征，分析需求痛点',
        handler: this._analyzeUser.bind(this),
      })
      .addStage('sceneDesign', {
        name: '场景构建设计',
        description: '设计真实可信的产品使用场景',
        handler: this._designScenes.bind(this),
      })
      .addStage('storyCreation', {
        name: '故事叙事创作',
        description: '创作完整的品牌推广故事内容',
        handler: this._createStory.bind(this),
      })
      .addStage('contentOptimization', {
        name: '内容优化完善',
        description: '润色优化，确保符合品牌调性',
        handler: this._optimizeContent.bind(this),
      });
  }

  async createBrandStory(input: BrandStoryInput) {
    const { productInfo, brandPositioning, targetAudience, options = {} } = input;

    const context = {
      productInfo,
      brandPositioning: brandPositioning || { tone: this.config.defaultTone, values: [], channels: ['微信公众号', '小红书'] },
      targetAudience: targetAudience || { description: '追求品质生活的都市白领', demographics: {}, psychographics: {} },
      options: { ...this.config, ...options }
    };

    const result = await this.workflow.execute(context);
    return this._buildOutput(result);
  }

  async quickCreate(productName: string, productDesc: string, targetUser: string, productFeatures: string[] = []) {
    return this.createBrandStory({
      productInfo: { name: productName, description: productDesc, features: productFeatures },
      brandPositioning: { tone: 'warm_professional', values: [], channels: ['微信公众号', '小红书'] },
      targetAudience: { description: targetUser, demographics: {}, psychographics: {} }
    });
  }

  private async _analyzeProduct(context: any) {
    const { productInfo } = context;
    const prompt = this.promptTemplate.render('productAnalysis', {
      productName: productInfo.name,
      productDescription: productInfo.description,
      productFeatures: productInfo.features,
      productCategory: productInfo.category,
      competitiveLandscape: productInfo.competitors
    });

    return await this.contentGenerator.generate(prompt, { temperature: 0.3, maxTokens: 1500 });
  }

  private async _analyzeUser(context: any) {
    const { targetAudience, valueProposition } = context;
    const prompt = this.promptTemplate.render('userInsight', {
      targetAudience: targetAudience.description,
      demographics: targetAudience.demographics,
      psychographics: targetAudience.psychographics,
      valueProposition: valueProposition
    });

    return await this.contentGenerator.generate(prompt, { temperature: 0.4, maxTokens: 1500 });
  }

  private async _designScenes(context: any) {
    const { userPersona, keyFeatures, painPoints } = context;
    const prompt = this.promptTemplate.render('sceneDesign', {
      userPersona, keyFeatures, painPoints, sceneCount: 2
    });

    return await this.contentGenerator.generate(prompt, { temperature: 0.6, maxTokens: 2000 });
  }

  private async _createStory(context: any) {
    const { scenarios, valueProposition, brandPositioning } = context;
    const prompt = this.promptTemplate.render('storyCreation', {
      scenarios, valueProposition,
      brandTone: brandPositioning?.tone || 'warm_professional',
      brandValues: brandPositioning?.values,
      storyLength: '800-1200字'
    });

    return await this.contentGenerator.generate(prompt, { temperature: 0.7, maxTokens: 3000 });
  }

  private async _optimizeContent(context: any) {
    const { storyContent, content, brandPositioning } = context;
    const rawContent = content || storyContent || '';
    const prompt = this.promptTemplate.render('contentOptimization', {
      content: rawContent,
      brandTone: brandPositioning?.tone || 'warm_professional'
    });

    const optimized = await this.contentGenerator.generate(prompt, { temperature: 0.5, maxTokens: 3000 });
    const validation = this.validator.validate(optimized.content || rawContent);

    return {
      finalContent: optimized.content || rawContent,
      distributionSuggestions: optimized.suggestions || [],
      keyMessages: optimized.keyMessages || [],
      emotionalTriggers: optimized.emotionalTriggers || [],
      validation
    };
  }

  private _buildOutput(result: any) {
    const finalContent = result.finalContent || result.storyContent || result.content || '';
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '3.0.0',
        workflowStages: 5,
        duration: result.metadata?.duration,
        provider: this.contentGenerator.getConfig().provider,
        model: this.contentGenerator.getConfig().model,
        isMock: this.contentGenerator.getConfig().provider === 'mock',
      },
      productValue: {
        coreValue: result.valueProposition?.core || '',
        extended: result.valueProposition?.extended || '',
        differentiation: result.differentiation || {},
        keyFeatures: result.keyFeatures || [],
        coreBenefits: result.coreBenefits || {}
      },
      userProfile: {
        persona: result.persona || {},
        painPoints: result.painPoints || [],
        emotionalNeeds: result.emotionalNeeds || [],
        motivationTriggers: result.motivationTriggers || []
      },
      scenarios: result.scenarios || [],
      brandStory: {
        content: finalContent,
        wordCount: finalContent.length,
        emotionalResonance: result.emotionalResonance || {},
        narrativeArc: result.narrativeArc || {},
        keyMessages: result.keyMessages || [],
        callToAction: result.callToAction || {}
      },
      quality: result.validation || { passed: true },
      contentScore: this.validator.scoreContent(finalContent, { brandTone: result.brandPositioning?.tone }),
      stats: this.contentGenerator.getStats()
    };
  }
}

export class BrandStoryError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'BrandStoryError';
  }
}
