import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, CreditCard, Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { Avatar, Button, Input } from '../components/ui'
import { formatPrice } from '../lib/utils'
import { cn } from '../lib/utils'

export default function Checkout() {
  const { currentUser, cart, removeFromCart, checkout, toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [method, setMethod] = useState('card')
  const [card, setCard] = useState('')
  const [done, setDone] = useState(false)

  const items = COURSES.filter((c) => cart.includes(c.id))
  const total = items.reduce((a, c) => a + (c.discountPrice ?? c.price), 0)

  if (!currentUser) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('checkout.signInToCheckout')}</h1>
        <Button className="mt-4" onClick={() => nav(`/login?next=/checkout`)}>{t('checkout.logIn')}</Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success"><CheckCircle2 className="h-10 w-10" /></div>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">{t('checkout.orderComplete')}</h1>
          <p className="mt-2 text-sm text-muted">{t('checkout.orderCompleteDesc')}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => nav('/my-learning')}>{t('checkout.startLearning')}</Button>
            <Button variant="outline" onClick={() => nav('/courses')}>{t('checkout.keepBrowsing')}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <Link to="/courses" className="text-sm text-muted hover:text-brand-700">{t('checkout.continueBrowsing')}</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{t('checkout.title')}</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink">{t('checkout.paymentMethod')}</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {[['card', t('checkout.card'), <CreditCard key="c" className="h-5 w-5" />], ['paypal', t('checkout.paypal'), <span key="p" className="font-display text-base font-bold italic">Pay</span>], ['wallet', t('checkout.wallet'), <ShieldCheck key="w" className="h-5 w-5" />]].map(([id, label, icon]) => (
                <button key={id as string} onClick={() => setMethod(id as string)} className={cn('flex items-center gap-2 rounded-control border p-4 text-sm font-medium transition-colors', method === id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-muted hover:text-ink')}>
                  {icon as React.ReactNode} {label}
                </button>
              ))}
            </div>
            {method === 'card' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input label={t('checkout.cardNumber')} value={card} onChange={(e) => setCard(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" className="sm:col-span-2" />
                <Input label={t('checkout.expiry')} placeholder="MM / YY" />
                <Input label={t('checkout.cvc')} placeholder="123" />
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <Lock className="h-3.5 w-3.5" /> {t('checkout.encrypted')}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink">{t('checkout.billingInfo')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('checkout.fullName')} defaultValue={currentUser.name} />
              <Input label={t('checkout.email')} defaultValue={currentUser.email} type="email" />
              <Input label={t('checkout.country')} placeholder={t('checkout.countryPlaceholder')} />
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6 lg:sticky lg:top-20">
            <h2 className="mb-4 font-semibold text-ink">{t('checkout.orderSummary')}</h2>
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <ShoppingBag className="h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">{t('checkout.cartEmpty')}</p>
                  <Button variant="outline" onClick={() => nav('/courses')}>{t('checkout.browseCourses')}</Button>
                </div>
              ) : items.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar name={c.title} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                    <p className="text-xs text-muted">{formatPrice(c.discountPrice ?? c.price)}</p>
                  </div>
                  <button onClick={() => removeFromCart(c.id)} className="text-xs text-muted hover:text-danger">{t('checkout.remove')}</button>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <>
                <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between text-muted"><span>{t('checkout.subtotal')}</span><span>{formatPrice(total)}</span></div>
                  <div className="flex justify-between text-muted"><span>{t('checkout.discount')}</span><span className="text-success">-{formatPrice(items.reduce((a, c) => a + (c.price - (c.discountPrice ?? c.price)), 0))}</span></div>
                  <div className="flex justify-between text-base font-semibold text-ink"><span>{t('checkout.total')}</span><span>{formatPrice(total)}</span></div>
                </div>
                <Button className="mt-5 w-full py-3" disabled={total === 0} onClick={() => { checkout(method === 'card' ? `Card **** ${card.slice(-4) || '4242'}` : method); setDone(true); toast(t('checkout.paymentSuccessful'), t('checkout.welcomeAboard')) }}>{t('checkout.completePurchase')}</Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5 text-success" /> {t('checkout.guarantee')}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}