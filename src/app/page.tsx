import Link from "next/link";
import { AgUIChatInterface } from "~/components/chat/AgUIChatInterface";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Learn <span className="text-[hsl(280,100%,70%)]">Romanian</span>
        </h1>
        
        <div className="text-center">
          <p className="text-2xl text-white/80">
            Practice Romanian with AG-UI Protocol
          </p>
          <p className="mt-2 text-lg text-white/60">
            Real-time streaming with Mastra agents and event-driven communication
          </p>
          <p className="mt-1 text-sm text-white/50">
            Powered by Mastra + AG-UI + CopilotKit
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <AgUIChatInterface />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-white/80">
            Built with the T3 Stack
          </p>
          <div className="flex gap-4 text-center">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">First Steps →</h3>
              <div className="text-lg">
                Just the basics - everything you need to know to set up your
                database and authentication.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Documentation →</h3>
              <div className="text-lg">
                Learn more about Next.js, TypeScript, and the T3 Stack.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
