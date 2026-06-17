# 🤖 AI Customer Support Agent
> **Made by Vaibhav Sonava**

> Production-grade AI-powered customer support agent for e-commerce refunds with real-time reasoning visualization, fraud detection, and voice capabilities.

![AI Support Agent](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-blue?style=for-the-badge)
![Deepgram](https://img.shields.io/badge/Deepgram-Nova_3-green?style=for-the-badge)

## ✨ Features

### 🎯 Core Agent Capabilities
- **LangGraph-style Agent Loop**: State machine-based decision engine with tool calling
- **CRM Integration**: 15 diverse customer profiles (VIP, fraud-risk, new-account edge cases)
- **Policy Engine**: Strict refund policy enforcement with auto-deny rules
- **Fraud Detection**: Real-time fraud scoring with composite risk analysis
- **Human Escalation**: Automatic escalation after 3 denials or VIP override
- **"Hold the Line"**: Firm but polite policy enforcement with alternative offers

### 🔊 Voice Capabilities
- **Speech-to-Text**: Deepgram Nova-3 for accurate voice input
- **Text-to-Speech**: Deepgram Aura for natural voice responses
- **Real-time Transcription**: Click-to-speak with automatic transcription

### 🎨 Beautiful UI
- **Customer Chat Interface**: Dark-themed, glassmorphism design with animated messages
- **Admin Dashboard**: Real-time reasoning trace cards, fraud alerts, decision statistics
- **Responsive Design**: Works on desktop and mobile
- **Micro-animations**: Smooth transitions and interactive elements

### 🛡️ Auto-Deny Rules
| Rule | Threshold | Action |
|------|-----------|--------|
| Fraud Score | > 0.7 | Auto-deny + security flag |
| Recent Refunds | 3+ in 90 days | Auto-deny (VIP exempt) |
| Account Age | < 7 days | Auto-deny |
| Missing Proof | No documentation | Auto-deny |

### 📊 Admin Dashboard
- Live reasoning trace cards (step-by-step agent decisions)
- Decision statistics with Recharts visualizations
- Real-time fraud alerts with severity levels
- Agent performance metrics
- Active conversation monitoring

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Next.js 14, Tailwind CSS, shadcn/ui |
| LLM Brain | Groq API (LLaMA 3.3 70B Versatile) |
| Voice STT | Deepgram Nova-3 |
| Voice TTS | Deepgram Aura |
| Charts | Recharts |
| Animations | Framer Motion |
| Real-time | Server-Sent Events (SSE) |
| CRM Data | In-memory store with 15 pre-seeded profiles |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Deepgram API key (free $200 credit at [deepgram.com](https://deepgram.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-support-agent.git
   cd ai-support-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Customer Chat: [http://localhost:3000](http://localhost:3000)
   - Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 Project Structure

```
ai-support-agent/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Customer chat interface
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles & design system
│   │   └── api/
│   │       ├── chat/route.ts     # Chat processing endpoint
│   │       ├── customers/route.ts # CRM data endpoint
│   │       ├── stats/route.ts    # Dashboard stats endpoint
│   │       ├── events/route.ts   # SSE for real-time updates
│   │       ├── tts/route.ts      # Text-to-Speech endpoint
│   │       └── stt/route.ts      # Speech-to-Text endpoint
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── index.ts          # Main agent loop (LangGraph-style)
│   │   │   ├── types.ts          # TypeScript type definitions
│   │   │   ├── tools.ts          # Agent tools (CRM, policy, fraud, escalation)
│   │   │   └── policy.ts         # Refund policy engine
│   │   ├── crm/
│   │   │   ├── data.ts           # 15 customer profiles + orders
│   │   │   └── store.ts          # In-memory state management
│   │   ├── groq.ts               # Groq LLM client with retry logic
│   │   └── utils.ts              # Utility functions
│   └── components/
│       └── ui/                   # shadcn/ui components
├── .env.local                    # Environment variables (not committed)
├── .env.example                  # Example environment template
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## 🧪 Test Scenarios

### Customer Profiles to Test

| # | Customer | Scenario | Expected Result |
|---|----------|----------|----------------|
| 1 | Sarah Chen (CUST-001) | VIP refund request | Approved with VIP courtesy |
| 2 | Karen Mitchell (CUST-003) | 4th refund in 90 days | Auto-denied (frequency) |
| 3 | Mike Johnson (CUST-004) | Fraud score 0.85 | Auto-denied (fraud) |
| 4 | Emily Davis (CUST-006) | 3-day old account | Auto-denied (new account) |
| 5 | Bob Smith (CUST-013) | Fraud score 0.92 | Auto-denied + critical alert |
| 6 | Chris Martinez (CUST-012) | First-ever refund | Approved smoothly |
| 7 | Rachel Green (CUST-010) | No proof provided | Auto-denied (missing proof) |
| 8 | Marcus Williams (CUST-015) | Loyal but frequent returns | Handled with care |

### Sample Prompts
```
"I want a refund for my recent order. The item arrived damaged."
"I need my money back. This product is terrible quality."
"Can I return my order? I changed my mind."
"I never received my package. I want a full refund."
"This is unacceptable! I demand to speak to a manager!"
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Process chat messages |
| GET | `/api/customers` | List all customer profiles |
| GET | `/api/customers?id=CUST-001` | Get specific customer |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/events` | SSE stream for real-time updates |
| POST | `/api/tts` | Text-to-Speech conversion |
| POST | `/api/stt` | Speech-to-Text transcription |

## 📄 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for LLM | Yes |
| `DEEPGRAM_API_KEY` | Deepgram API key for voice | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL (auto-set by Vercel) | No |

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Build
```bash
npm run build
npm start
```

## 📜 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
