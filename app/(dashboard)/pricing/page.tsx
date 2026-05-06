import { checkoutAction } from '@/lib/payments/actions';
import { Check, AlertCircle } from 'lucide-react';
import { getStripePrices, getStripeProducts, isStripeConfigured } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

export const revalidate = 3600;

export default async function PricingPage() {
  const configured = isStripeConfigured();
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === '基础版' || product.name === 'Base');
  const plusPlan = products.find((product) => product.name === '专业版' || product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {!configured && (
        <div className="mb-8 max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">支付功能未配置</p>
            <p className="text-xs text-yellow-600 mt-1">请在 .env 文件中配置 STRIPE_SECRET_KEY 以启用在线支付功能。当前显示为演示价格。</p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={basePlan?.name || '基础版'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            '无限使用',
            '无限团队成员',
            '邮件支持',
          ]}
          priceId={basePrice?.id}
          configured={configured}
        />
        <PricingCard
          name={plusPlan?.name || '专业版'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            '包含基础版所有功能，以及：',
            '新功能抢先体验',
            '7×24小时支持 + Slack 通道',
          ]}
          priceId={plusPrice?.id}
          configured={configured}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  configured,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  configured: boolean;
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {trialDays}天免费试用
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ¥{price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          每用户 / {interval === 'month' ? '月' : interval === 'year' ? '年' : interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      {configured && priceId ? (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton />
        </form>
      ) : (
        <button
          disabled
          className="w-full py-2 px-4 border border-gray-300 rounded-full text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
        >
          即将开放
        </button>
      )}
    </div>
  );
}
