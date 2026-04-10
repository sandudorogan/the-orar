import { useMessages } from "@/app/i18n/use-i18n.ts"
import type { MessageCatalog } from "@orar/locales"
import {
	BookOpen,
	CalendarDays,
	DoorOpen,
	FileDown,
	GraduationCap,
	ShieldCheck,
	Users,
	Zap,
} from "lucide-react"
import type { ReactNode } from "react"

type LandingKey = keyof MessageCatalog["landing"]

interface Feature {
	icon: ReactNode
	titleKey: LandingKey
	descKey: LandingKey
}

const features: Feature[] = [
	{
		icon: <GraduationCap className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureClasses",
		descKey: "featureClassesDesc",
	},
	{
		icon: <Users className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureTeachers",
		descKey: "featureTeachersDesc",
	},
	{
		icon: <DoorOpen className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureClassrooms",
		descKey: "featureClassroomsDesc",
	},
	{
		icon: <BookOpen className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureActivities",
		descKey: "featureActivitiesDesc",
	},
	{
		icon: <ShieldCheck className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureConstraints",
		descKey: "featureConstraintsDesc",
	},
	{
		icon: <Zap className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureGenerate",
		descKey: "featureGenerateDesc",
	},
	{
		icon: <CalendarDays className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureTimetables",
		descKey: "featureTimetablesDesc",
	},
	{
		icon: <FileDown className="h-10 w-10 text-landing-accent" />,
		titleKey: "featureExports",
		descKey: "featureExportsDesc",
	},
]

export function FeaturesSection() {
	const messages = useMessages()

	return (
		<section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
			<div className="text-center">
				<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
					{messages.landing.featuresTitle}
				</h2>
				<p className="text-lg text-text-secondary mt-4 max-w-2xl mx-auto">
					{messages.landing.featuresSubtitle}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
				{features.map((f) => (
					<div
						key={f.titleKey}
						className="rounded-xl border border-border-subtle bg-surface-card p-6 transition-shadow hover:shadow-md"
					>
						{f.icon}
						<h3 className="font-semibold text-text-primary mt-4">{messages.landing[f.titleKey]}</h3>
						<p className="text-sm text-text-secondary mt-2">{messages.landing[f.descKey]}</p>
					</div>
				))}
			</div>
		</section>
	)
}
