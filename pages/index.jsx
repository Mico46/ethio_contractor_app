import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Ethiopian Contractor - Construction Site Tracker</title>
        <meta name="description" content="Construction site tracking and HR management for Ethiopian contractors" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ethiopian Contractor</span>
            </div>
            <a href="/login" className="btn-primary">Sign In</a>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-accent">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Build Smarter,<br />
                <span className="text-blue-200">Manage Better</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
                The all-in-one construction site tracker designed for Ethiopian contractors.
                Manage sites, track progress, monitor expenses, and lead your team — all in one place.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/login" className="bg-white text-primary font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors text-lg">
                  Get Started Free
                </a>
                <a href="#features" className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-lg">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: "7+", label: "Data Models" },
                { value: "Real-time", label: "Sync" },
                { value: "Offline", label: "Support" },
                { value: "100%", label: "Free" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything You Need</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Complete construction management with Ethiopian Birr (ETB) support and offline-first design.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Site Management", desc: "Track all your construction sites with budgets, progress, and status in real-time.", color: "bg-blue-50 text-primary" },
                { title: "Task Tracking", desc: "Assign tasks to workers, set priorities and due dates, and monitor completion.", color: "bg-purple-50 text-accent" },
                { title: "HR & Staff", desc: "Manage workers, foremen, supervisors and admins with role-based access.", color: "bg-teal-50 text-secondary" },
                { title: "Daily Logs", desc: "Record daily work progress, weather conditions, worker counts, and issues.", color: "bg-green-50 text-success" },
                { title: "Materials", desc: "Track material deliveries, quantities, types, and costs per site.", color: "bg-amber-50 text-warning" },
                { title: "Photos & Reports", desc: "Capture site photos and generate budget vs expense analytics with charts.", color: "bg-red-50 text-danger" },
              ].map((feature) => (
                <div key={feature.title} className="card card-hover p-6">
                  <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <div className="w-5 h-5 rounded bg-current opacity-30"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary to-accent py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Construction Management?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join Ethiopian contractors who are building smarter with modern tools.
            </p>
            <a href="/login" className="bg-white text-primary font-semibold px-10 py-4 rounded-lg hover:bg-blue-50 transition-colors text-lg inline-block">
              Start Now — It&apos;s Free
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-sidebar py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">EC</span>
              </div>
              <span className="text-white font-semibold">Ethiopian Contractor</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Ethiopian Contractor App. Built for the construction industry.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
