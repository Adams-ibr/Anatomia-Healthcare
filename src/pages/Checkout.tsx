import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2, Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useApp } from '../lib/store'
import { Button, Input } from '../components/ui'
import { formatPrice } from '../lib/utils'
import { cn } from '../lib/utils'

export default function Checkout() {
  const { currentUser, cart, cartCourses, removeFromCart, checkout, verifyCheckout, toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const reference = searchParams.get('reference')

  useEffect(() => {
    if (!reference || !currentUser) return
    let cancelled = false
    setVerifying(true)
    verifyCheckout(reference).then((res) => {
      if (cancelled) return
      setVerifying(false)
      if (res.ok) {
        setDone(true)
        toast(t('checkout.paymentSuccessful'), t('checkout.welcomeAboard'))
      } else {
        setFailed(true)
        toast(t('checkout.paymentFailed'), res.error, 'error')
      }
      const params = new URLSearchParams(searchParams)
      params.delete('reference')
      params.delete('trxref')
      setSearchParams(params, { replace: true })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, currentUser])

  // Resolve cart items from stored course snapshots (cartCourses),
  // falling back to just the ID if no snapshot is available
  const items = cart.map((id) => cartCourses[id] ?? { id, title: id, price: 0 })
  const total = items.reduce((a, c) => a + (c.discountPrice ?? c.price), 0)

  if (!currentUser) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('checkout.signInToCheckout')}</h1>
        <Button className="mt-4" onClick={() => nav(`/login?next=/checkout`)}>{t('checkout.logIn')}</Button>
      </div>
    )
  }

  if (verifying) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Loader2 className="h-10 w-10 animate-spin" /></div>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">{t('checkout.verifying')}</h1>
          <p className="mt-2 text-sm text-muted">{t('checkout.verifyingDesc')}</p>
        </div>
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

  const handlePurchase = async () => {
    if (processing) return
    setProcessing(true)
    try {
      const result = await checkout('paystack')
      if (result === 'completed') {
        setDone(true)
        toast(t('checkout.paymentSuccessful'), t('checkout.welcomeAboard'))
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container-page py-10">
      <Link to="/courses" className="text-sm text-muted hover:text-brand-700">{t('checkout.continueBrowsing')}</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{t('checkout.title')}</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink">{t('checkout.paymentMethod')}</h2>
            <button
              onClick={() => setFailed(false)}
              className={cn('flex w-full items-center gap-3 rounded-control border p-4 text-left transition-colors', failed ? 'border-danger/40 bg-danger/5 text-danger' : 'border-brand-500 bg-brand-50 text-brand-700')}
            >
              <span className="flex h-9 w-14 items-center justify-center rounded-md bg-[#0ba4db] font-display text-sm font-bold text-white">Paystack</span>
              <span className="text-sm font-medium">{t('checkout.paystack')}</span>
              <ShieldCheck className="ml-auto h-5 w-5" />
            </button>
            {failed && (
              <p className="mt-3 rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{t('checkout.paymentFailed')} {t('checkout.paymentFailedDesc')}</p>
            )}
            <p className="mt-4 text-sm text-muted">{t('checkout.paystackNote')}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Lock className="h-3.5 w-3.5" /> {t('checkout.encrypted')}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink">{t('checkout.billingInfo')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('checkout.fullName')} defaultValue={currentUser.name} disabled />
              <Input label={t('checkout.email')} defaultValue={currentUser.email} type="email" disabled />
            </div>
            <p className="mt-3 text-xs text-muted">{t('checkout.billingNote')}</p>
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
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-50 text-xs font-semibold text-brand-700">H</span>
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
                <Button className="mt-5 w-full py-3" disabled={processing} onClick={handlePurchase}>
                  {processing ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t('checkout.redirecting')}</span>
                  ) : (
                    t('checkout.completePurchase')
                  )}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5 text-success" /> {t('checkout.guarantee')}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}