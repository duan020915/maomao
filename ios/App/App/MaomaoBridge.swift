import Capacitor
import Foundation
import UIKit
import UserNotifications
import WidgetKit

@objc(MaomaoBridge)
public class MaomaoBridge: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MaomaoBridge"
    public let jsName = "MaomaoNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidget", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "registerForPush", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumeNotification", returnType: CAPPluginReturnPromise)
    ]

    private let groupID = "group.com.duan020915.maomao"
    static weak var active: MaomaoBridge?
    static var pushToken: String?
    static var pendingNotification: [String: Any]?
    static var pushEnvironment: String {
        #if DEBUG
        return "sandbox"
        #else
        return "production"
        #endif
    }

    override public func load() {
        Self.active = self
    }

    static func receivedToken(_ value: String) {
        pushToken = value
        DispatchQueue.main.async { active?.notifyListeners("pushToken", data: ["token": value, "environment": pushEnvironment]) }
    }

    static func receivedNotification(_ data: [String: Any]) {
        pendingNotification = data
        DispatchQueue.main.async { active?.notifyListeners("notificationTapped", data: data) }
    }

    @objc func updateWidget(_ call: CAPPluginCall) {
        guard let snapshot = call.getString("snapshot"),
              snapshot.utf8.count <= 16_384,
              let data = snapshot.data(using: .utf8),
              (try? JSONSerialization.jsonObject(with: data)) is [String: Any],
              let defaults = UserDefaults(suiteName: groupID) else {
            call.reject("Widget snapshot is unavailable")
            return
        }
        defaults.set(snapshot, forKey: "widgetSnapshot")
        WidgetCenter.shared.reloadTimelines(ofKind: "MaomaoToday")
        call.resolve()
    }

    @objc func requestNotifications(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve(["granted": granted])
            }
        }
    }

    @objc func registerForPush(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else {
                call.reject("请先允许冒冒发送通知")
                return
            }
            DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
            call.resolve(["token": Self.pushToken ?? "", "environment": Self.pushEnvironment])
        }
    }

    @objc func consumeNotification(_ call: CAPPluginCall) {
        let pending = Self.pendingNotification
        Self.pendingNotification = nil
        call.resolve(["notification": pending ?? [:]])
    }
}

final class MaomaoBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MaomaoBridge())
    }
}
