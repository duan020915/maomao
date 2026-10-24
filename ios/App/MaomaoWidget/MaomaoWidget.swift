import SwiftUI
import WidgetKit

private struct TodayPlan: Codable {
    let time: String
    let name: String
    let body: String
}

private struct RecentMood: Codable {
    let icon: String
    let name: String
    let person: String
    let day: String
    let body: String
}

private struct WidgetSnapshot: Codable {
    let group: String
    let day: String
    let plans: [TodayPlan]
    let mood: RecentMood?
    let newCount: Int
}

private struct TodayEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

private struct TodayProvider: TimelineProvider {
    private func snapshot() -> WidgetSnapshot? {
        guard let value = UserDefaults(suiteName: "group.com.duan020915.maomao")?.string(forKey: "widgetSnapshot"),
              let data = value.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }

    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(date: .now, snapshot: WidgetSnapshot(group: "周末不宅家", day: Self.todayKey(), plans: [TodayPlan(time: "09:00", name: "小桃", body: "去逛花市 🌼")], mood: nil, newCount: 1))
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        completion(TodayEntry(date: .now, snapshot: snapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let now = Date()
        let nextDay = Calendar.current.nextDate(after: now, matching: DateComponents(hour: 0, minute: 1), matchingPolicy: .nextTime) ?? now.addingTimeInterval(3600)
        completion(Timeline(entries: [TodayEntry(date: now, snapshot: snapshot())], policy: .after(nextDay)))
    }

    private static func todayKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: .now)
    }
}

private enum Crayon {
    static let ink = Color(red: 0.34, green: 0.25, blue: 0.22)
    static let clay = Color(red: 0.70, green: 0.40, blue: 0.31)
    static let olive = Color(red: 0.48, green: 0.53, blue: 0.38)
    static let paper = Color(red: 0.98, green: 0.95, blue: 0.87)
    static let yellow = Color(red: 0.91, green: 0.70, blue: 0.32)
}

private struct PaperTexture: View {
    var body: some View {
        Canvas { context, size in
            for i in 0..<180 {
                let x = CGFloat((i * 73 + 19) % 997) / 997 * size.width
                let y = CGFloat((i * 149 + 47) % 991) / 991 * size.height
                var stroke = Path()
                stroke.move(to: CGPoint(x: x, y: y))
                stroke.addLine(to: CGPoint(x: x + CGFloat(1 + i % 4), y: y + CGFloat(i % 3)))
                context.stroke(stroke, with: .color(Crayon.clay.opacity(i % 3 == 0 ? 0.11 : 0.06)), lineWidth: 0.7)
            }
        }
        .accessibilityHidden(true)
    }
}

private struct CrayonFrame: View {
    var body: some View {
        Canvas { context, size in
            let left: CGFloat = 7, right = size.width - 7
            let top: CGFloat = 9, bottom = size.height - 8
            var border = Path()
            border.move(to: CGPoint(x: left + 15, y: top))
            border.addQuadCurve(to: CGPoint(x: right - 13, y: top + 1), control: CGPoint(x: size.width * 0.48, y: top - 2))
            border.addQuadCurve(to: CGPoint(x: right, y: top + 15), control: CGPoint(x: right + 1, y: top - 1))
            border.addQuadCurve(to: CGPoint(x: right - 1, y: bottom - 14), control: CGPoint(x: right + 2, y: size.height * 0.53))
            border.addQuadCurve(to: CGPoint(x: right - 15, y: bottom), control: CGPoint(x: right + 1, y: bottom + 1))
            border.addQuadCurve(to: CGPoint(x: left + 14, y: bottom - 1), control: CGPoint(x: size.width * 0.55, y: bottom + 2))
            border.addQuadCurve(to: CGPoint(x: left, y: bottom - 15), control: CGPoint(x: left - 1, y: bottom + 1))
            border.addQuadCurve(to: CGPoint(x: left + 1, y: top + 15), control: CGPoint(x: left - 2, y: size.height * 0.42))
            border.addQuadCurve(to: CGPoint(x: left + 15, y: top), control: CGPoint(x: left - 1, y: top - 1))
            context.stroke(border, with: .color(Crayon.clay.opacity(0.72)), style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [5, 4]))
            context.stroke(border, with: .color(Crayon.yellow.opacity(0.27)), style: StrokeStyle(lineWidth: 4, lineCap: .round, dash: [2, 7]))
        }
        .accessibilityHidden(true)
    }
}

private struct TodayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TodayEntry

    private var plans: [TodayPlan] {
        guard entry.snapshot?.day == Self.todayKey() else { return [] }
        return entry.snapshot?.plans ?? []
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            Crayon.paper
            PaperTexture()
            CrayonFrame()
            VStack(alignment: .leading, spacing: 5) {
                HStack(alignment: .top, spacing: 3) {
                    Text(plans.isEmpty && entry.snapshot?.mood != nil ? "冒冒·最近心情" : "冒冒·小日程")
                        .font(.system(size: family == .systemSmall ? 12 : 16, weight: .heavy, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.9)
                    Spacer(minLength: 0)
                    Text("✷").font(.system(size: family == .systemSmall ? 12 : 15, weight: .bold)).foregroundStyle(Crayon.yellow)
                }
                Text(entry.snapshot?.group ?? "打开冒冒，看看今天")
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .lineLimit(1)
                    .foregroundStyle(Crayon.olive)
                HStack(spacing: 2) {
                    Capsule().fill(Crayon.clay.opacity(0.55)).frame(height: 2)
                    Circle().fill(Crayon.clay.opacity(0.55)).frame(width: 2, height: 2)
                }
                .padding(.vertical, 3)
                if !plans.isEmpty {
                    ForEach(Array(plans.prefix(family == .systemSmall ? 1 : 3).enumerated()), id: \.offset) { _, plan in
                        VStack(alignment: .leading, spacing: 2) {
                            Text("✿  \(plan.time) · \(plan.name)")
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                .foregroundStyle(Crayon.clay)
                                .lineLimit(1)
                            Text(plan.body)
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .lineLimit(family == .systemSmall ? 2 : 1)
                        }
                    }
                } else if let mood = entry.snapshot?.mood {
                    moodContent(mood)
                } else {
                    Text("今天没安排")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                    Text("去冒个泡吧 ♡")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(Crayon.clay)
                }
                Spacer(minLength: 0)
                if (entry.snapshot?.newCount ?? 0) > 0 {
                    Text("✦ 圈里有新消息")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(Crayon.clay)
                }
            }
            .foregroundStyle(Crayon.ink)
            .padding(.horizontal, 17)
            .padding(.top, 20)
            .padding(.bottom, 15)
        }
        .overlay(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(red: 0.88, green: 0.79, blue: 0.63).opacity(0.75))
                .frame(width: 27, height: 8)
                .rotationEffect(.degrees(11))
                .offset(x: -21, y: 5)
                .accessibilityHidden(true)
        }
        .widgetURL(URL(string: "maomao-duan020915://widget/today"))
        .containerBackground(Crayon.paper, for: .widget)
    }

    @ViewBuilder
    private func moodContent(_ mood: RecentMood) -> some View {
        HStack(alignment: .top, spacing: 6) {
            if let path = Bundle.main.path(forResource: mood.icon, ofType: "png", inDirectory: "Moods"),
               let image = UIImage(contentsOfFile: path) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 35, height: 35)
            } else {
                Text("♡").font(.system(size: 29)).foregroundStyle(Crayon.clay)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("最近的心情 · \(mood.person)")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(Crayon.clay)
                    .lineLimit(1)
                Text(mood.name)
                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                    .lineLimit(1)
            }
        }
        if family != .systemSmall {
            Text(mood.body)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .lineLimit(1)
        }
    }

    private static func todayKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: .now)
    }
}

@main
struct MaomaoWidget: Widget {
    let kind = "MaomaoToday"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodayProvider()) { entry in
            TodayWidgetView(entry: entry)
        }
        .configurationDisplayName("冒冒 · 今天的小日程")
        .description("有安排看日程，没安排看看朋友最近的心情。")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
