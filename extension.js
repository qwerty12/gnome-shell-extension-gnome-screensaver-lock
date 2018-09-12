/*
	Credits:
	https://github.com/laserb/gnome-shell-extension-suspend-button
	https://github.com/arelange/gnome-shell-extension-hibernate-status
*/

const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Util = imports.misc.util;
const BoxPointer = imports.ui.boxpointer;

let systemMenu, _cancellable, _proxy, _lockAction, _lockActionId;

function init() {
}

function _onProxyCallFailure(o, res)
{
	try {
		o.call_finish(res);
	} catch(e) {
		// Make one last-ditch attempt by having the D-Bus call done externally
		Util.spawn(['gnome-screensaver-command', '-l']);
	}
}

function _onLockClicked()
{
	systemMenu.menu.itemActivated(BoxPointer.PopupAnimation.NONE);
	_proxy.call("Lock", null, Gio.DBusCallFlags.NONE, -1, null, _onProxyCallFailure);
}

function _onProxyReady(o, res) {
	try {
		_cancellable = null;

		_proxy = Gio.DBusProxy.new_finish(res);

		_lockAction = systemMenu._createActionButton('system-lock-screen-symbolic', C_("search-result", "Lock Screen"));
		_lockActionId = _lockAction.connect('clicked', _onLockClicked);

		systemMenu._actionsItem.actor.insert_child_at_index(_lockAction, 2);
		_lockAction.visible = true;
	} catch(e) {
		return;
	}
}

function enable() {
	systemMenu = Main.panel.statusArea['aggregateMenu']._system;
	_cancellable = new Gio.Cancellable();
    Gio.DBusProxy.new(Gio.DBus.session,
                      Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES | Gio.DBusProxyFlags.DO_NOT_CONNECT_SIGNALS | Gio.DBusProxyFlags.DO_NOT_AUTO_START,
                      null,
                      "org.gnome.ScreenSaver",
                      "/org/gnome/ScreenSaver",
                      "org.gnome.ScreenSaver",
                      _cancellable,
                      _onProxyReady);
}

function disable() {
	if (_cancellable) {
		_cancellable.cancel();
		_cancellable = null;
	}

	if (_lockActionId) {
		_lockAction.disconnect(_lockActionId);
		_lockActionId = 0;
	}

	if (_proxy) {
		_proxy = null;
	}

	if (_lockAction) {
		_lockAction.visible = false;
		if (systemMenu)
			systemMenu._actionsItem.actor.remove_child(_lockAction);
		_lockAction.destroy();
		_lockAction = null;
	}

	if (systemMenu)
		systemMenu = null;
}
