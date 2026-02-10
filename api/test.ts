// Minimal diagnostic endpoint — no imports from server code
export default function handler(req: any, res: any) {
    res.status(200).json({
        status: "ok",
        time: new Date().toISOString(),
        env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasSessionSecret: !!process.env.SESSION_SECRET,
            hasPaystackKey: !!process.env.PAYSTACK_SECRET_KEY,
            hasAppUrl: !!process.env.APP_URL,
            nodeEnv: process.env.NODE_ENV,
        },
    });
}
