'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEOSchema } from '@/components/SEOSchema'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

const SUPPORT_EMAIL = 'ashish921998@zohomail.in'

const quickFaqs = [
  {
    question: 'How quickly do you respond?',
    answer:
      'We reply to every request within one business day (Monday–Saturday, 9:00 AM – 6:00 PM IST). Priority customers receive same-day callbacks.'
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Open the VineSight app → Settings → Delete account. If you need help, email us from your registered address and we will process it for you.'
  },
  {
    question: 'Where can I report a bug?',
    answer:
      'Send screenshots or a short description to ashish921998@zohomail.in. Include the farm name and the time the issue occurred so we can investigate quickly.'
  }
]

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEOSchema
        title="Help Center - VineSight Support"
        description="Get direct support for VineSight. Contact us for billing, technical questions, or account assistance."
        type="help"
        url="/help"
      />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Help & Support</h1>
            </div>
            <p className="text-base text-slate-600">
              Need help with VineSight? Reach us directly and we will get back within one business
              day.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <Card className="border-2 border-emerald-100 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Contact VineSight Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p>
              Email is the fastest way to reach our team. Include as much detail as possible
              (screenshots, farm name, error message) so we can help without back-and-forth.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email support
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://vinesight.vercel.app/privacy" rel="noreferrer">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  View privacy policy
                </a>
              </Button>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Support hours</p>
              <p>Monday – Saturday, 9:00 AM – 6:00 PM IST</p>
              <p className="mt-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                We provide emergency crop-risk guidance during harvest season even outside the
                stated hours.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Quick answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            {quickFaqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{faq.question}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
