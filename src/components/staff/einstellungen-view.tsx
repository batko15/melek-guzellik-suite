// Team-Portal — Einstellungen: Studio-Daten, Öffnungszeiten, Team, Template-Info

"use client"

import {
  Building2, MapPin, Phone, Instagram, Globe, Clock, Users, Info, Database,
  Palette, FileCode2, ShieldCheck, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

const todayIdx = (new Date().getDay() + 6) % 7

export function EinstellungenView() {
  const { company } = BRANDING
  const instagramUrl = `https://www.instagram.com/${company.instagram}`

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <Info className="h-3.5 w-3.5" /> Suite V{BRANDING.version} · Alles lokal
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Einstellungen & <span className="mk-gold-text">Stammdaten</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Studio-Daten, Öffnungszeiten, Team und White-Label-System.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* ─── Studio-Stammdaten ─── */}
          <Card className="mk-card">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Building2 className="h-4 w-4 text-brand-text" /> Studio-Stammdaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mk-display text-base font-bold">{company.legalName}</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-start gap-2.5 text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text/70" />
                  <span>{company.street} · {company.city}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-brand-text/70" /> {company.phone}
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Instagram className="h-3.5 w-3.5 shrink-0 text-brand-text/70" />
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-brand-text hover:underline">@{company.instagram}</a>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-brand-text/70" /> {company.website}
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Diese Daten stehen auf der Landing-Page (Kontakt-Sektion) und im Login-Bereich.
                Änderungen: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">src/config/branding.ts</code> → <span className="font-semibold text-foreground">company</span>.
              </p>
            </CardContent>
          </Card>

          {/* ─── Öffnungszeiten ─── */}
          <Card className="mk-card">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Clock className="h-4 w-4 text-brand-text" /> Öffnungszeiten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {BRANDING.openingHours.map((h, i) => (
                <div
                  key={h.day}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                    i === todayIdx ? "border border-primary/30 bg-primary/8" : "bg-secondary/25",
                  )}
                >
                  <span className={cn("font-medium", h.closed && "text-muted-foreground")}>
                    {h.day}
                    {i === todayIdx && <span className="ml-2 text-[10px] font-bold uppercase text-brand-text">Heute</span>}
                  </span>
                  <span className={cn("font-mono text-xs", h.closed ? "text-muted-foreground/70" : "text-foreground")}>{h.hours}</span>
                </div>
              ))}
              <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                Die Buchungs-Slots im Kundinnen-Portal ergeben sich automatisch aus diesen Zeiten (30-Minuten-Raster).
                Änderungen: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">branding.ts</code> → <span className="font-semibold text-foreground">openingHours</span>.
              </p>
            </CardContent>
          </Card>

          {/* ─── Team & Rollen ─── */}
          <Card className="mk-card">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Users className="h-4 w-4 text-brand-text" /> Team & Rollen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {BRANDING.users.map((u) => (
                <div key={u.username} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/25 p-3">
                  <span className="mk-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
                    {u.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.role} · Login «{u.username}»</div>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-primary/30 text-[10px] text-brand-text">Team</Badge>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-xs font-bold text-muted-foreground">
                  ♀
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">Kundinnen</div>
                  <div className="text-[11px] text-muted-foreground">Login mit Name + E-Mail — ohne Passwort</div>
                </div>
                <Badge variant="outline" className="shrink-0 border-border/60 text-[10px] text-muted-foreground">Portal</Badge>
              </div>
            </CardContent>
          </Card>

          {/* ─── White-Label / System ─── */}
          <Card className="mk-card">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 text-brand-text" /> White-Label & System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-text/70" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Eine Datei für alles:</span>{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">src/config/branding.ts</code> enthält Marke, Studio-Daten, Landing-Page-Texte, Öffnungszeiten, Team-Zugänge und alle Module (ein-/ausschaltbar).
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Palette className="mt-0.5 h-4 w-4 shrink-0 text-brand-text/70" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Eine Farbe für alles:</span>{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">globals.css → --brand</code> steuert Buttons, Charts, Badges und Glow-Effekte der gesamten Suite.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-brand-text/70" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Datenbank:</span> SQLite lokal (Leistungen, Kundinnen, Buchungen, Galerie) — kein Cloud-Zwang, alle Daten bleiben auf dem eigenen Server.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-text/70" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Demo-Modus:</span> Team-Logins sind Demo-Zugänge. Für den Echtbetrieb an ein echtes Auth-System anbinden (siehe TEMPLATE-GUIDE.md).
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{BRAND_DISPLAY.part1}{BRAND_DISPLAY.part2} Suite V{BRANDING.version}</span>
                <span>{BRANDING.locale.currency} · de-CH</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
