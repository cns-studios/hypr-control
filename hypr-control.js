#!/usr/bin/env node

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { execSync, exec } = require('child_process');
const fs = require('fs');

class HyprControl {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Hyprland System Control'
    });

    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    
    this.createLayout();
    this.showMainMenu();
  }

  createLayout() {
    this.mainBox = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: 'black'
      }
    });

    this.screen.append(this.mainBox);
  }

  execCommand(cmd) {
    try {
      return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  showMainMenu() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 1,
      left: 'center',
      width: '80%',
      height: 3,
      content: '{center}{bold}🖥️  HYPRLAND SYSTEM CONTROL{/bold}{/center}',
      tags: true,
      style: {
        fg: 'cyan',
        border: {
          fg: 'cyan'
        }
      },
      border: {
        type: 'line'
      }
    });

    const menu = blessed.list({
      top: 5,
      left: 'center',
      width: '60%',
      height: '70%',
      label: ' Main Menu ',
      keys: true,
      vi: true,
      mouse: true,
      border: {
        type: 'line'
      },
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
          bold: true
        },
        border: {
          fg: 'green'
        }
      },
      items: [
        '🖥️  Monitor Settings',
        '🔊 Audio Control',
        '📡 WiFi Management',
        '🔵 Bluetooth',
        '👥 User Management',
        '⚙️  System Info',
        '🎨 Hyprland Config',
        '🔋 Power Management',
        '❌ Exit'
      ]
    });

    const footer = blessed.box({
      bottom: 0,
      left: 'center',
      width: '100%',
      height: 3,
      content: '{center}Use ↑↓ arrows to navigate | Enter to select | ESC/q to go back{/center}',
      tags: true,
      style: {
        fg: 'white'
      }
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0: this.showMonitorSettings(); break;
        case 1: this.showAudioControl(); break;
        case 2: this.showWifiManagement(); break;
        case 3: this.showBluetoothControl(); break;
        case 4: this.showUserManagement(); break;
        case 5: this.showSystemInfo(); break;
        case 6: this.showHyprlandConfig(); break;
        case 7: this.showPowerManagement(); break;
        case 8: process.exit(0); break;
      }
    });

    this.mainBox.append(title);
    this.mainBox.append(menu);
    this.mainBox.append(footer);
    menu.focus();
    this.screen.render();
  }

  showMonitorSettings() {
    this.mainBox.children.forEach(child => child.destroy());

    const monitors = this.getMonitors();
    
    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}🖥️  Monitor Settings{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const monitorList = blessed.box({
      top: 4,
      left: 1,
      width: '48%',
      height: '50%',
      label: ' Connected Monitors ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: monitors,
      scrollable: true,
      tags: true
    });

    const menu = blessed.list({
      top: 4,
      right: 1,
      width: '48%',
      height: '50%',
      label: ' Actions ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        'Change Resolution',
        'Change Refresh Rate',
        'Arrange Monitors',
        'Toggle Monitor',
        'Set Primary Monitor',
        'Back'
      ]
    });

    const output = blessed.box({
      top: '55%',
      left: 1,
      width: '98%',
      height: '35%',
      label: ' Output ',
      border: { type: 'line' },
      style: { border: { fg: 'yellow' } },
      scrollable: true,
      tags: true
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0: this.changeResolution(output); break;
        case 1: this.changeRefreshRate(output); break;
        case 2: this.arrangeMonitors(output); break;
        case 3: this.toggleMonitor(output); break;
        case 4: this.setPrimaryMonitor(output); break;
        case 5: this.showMainMenu(); break;
      }
    });

    this.mainBox.append(title);
    this.mainBox.append(monitorList);
    this.mainBox.append(menu);
    this.mainBox.append(output);
    menu.focus();
    this.screen.render();
  }

  getMonitors() {
    const output = this.execCommand('hyprctl monitors -j');
    try {
      const monitors = JSON.parse(output);
      return monitors.map(m => 
        `{bold}${m.name}{/bold}\n` +
        `  Resolution: ${m.width}x${m.height}@${m.refreshRate}Hz\n` +
        `  Position: ${m.x},${m.y}\n` +
        `  Active: ${m.activeWorkspace?.name || 'N/A'}\n`
      ).join('\n');
    } catch {
      return 'Error getting monitors';
    }
  }

  changeResolution(output) {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Change Resolution ',
      tags: true
    });

    prompt.input('Enter monitor,WIDTHxHEIGHT (e.g., HDMI-A-1,1920x1080):', '', (err, value) => {
      if (value) {
        const [monitor, res] = value.split(',');
        const result = this.execCommand(`hyprctl keyword monitor ${monitor},${res}@60,0x0,1`);
        output.setContent(result);
        this.screen.render();
      }
    });

    this.screen.render();
  }

  changeRefreshRate(output) {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Change Refresh Rate '
    });

    prompt.input('Enter monitor,refresh_rate (e.g., HDMI-A-1,144):', '', (err, value) => {
      if (value) {
        const [monitor, hz] = value.split(',');
        const result = this.execCommand(`hyprctl keyword monitor ${monitor},preferred@${hz},auto,1`);
        output.setContent(result);
        this.screen.render();
      }
    });

    this.screen.render();
  }

  arrangeMonitors(output) {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Arrange Monitors '
    });

    prompt.input('Enter monitor,XxY position (e.g., HDMI-A-1,1920x0):', '', (err, value) => {
      if (value) {
        const [monitor, pos] = value.split(',');
        const result = this.execCommand(`hyprctl keyword monitor ${monitor},preferred,${pos},1`);
        output.setContent(result);
        this.screen.render();
      }
    });

    this.screen.render();
  }

  toggleMonitor(output) {
    const monitors = this.execCommand('hyprctl monitors -j');
    try {
      const parsed = JSON.parse(monitors);
      const list = blessed.list({
        parent: this.screen,
        top: 'center',
        left: 'center',
        width: '50%',
        height: '50%',
        border: { type: 'line' },
        label: ' Select Monitor to Toggle ',
        keys: true,
        vi: true,
        style: {
          selected: { bg: 'blue' }
        },
        items: parsed.map(m => m.name)
      });

      list.on('select', (item) => {
        const monitor = item.content;
        const result = this.execCommand(`hyprctl keyword monitor ${monitor},disable`);
        output.setContent(`Toggled ${monitor}\n${result}`);
        list.destroy();
        this.screen.render();
      });

      list.focus();
      this.screen.render();
    } catch {}
  }

  setPrimaryMonitor(output) {
    output.setContent('Primary monitor is set via Hyprland config.\nEdit ~/.config/hypr/hyprland.conf');
    this.screen.render();
  }

  showAudioControl() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}🔊 Audio Control{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const devices = this.getAudioDevices();
    
    const deviceList = blessed.box({
      top: 4,
      left: 1,
      width: '98%',
      height: '40%',
      label: ' Audio Devices ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: devices,
      scrollable: true,
      tags: true,
      mouse: true,
      keys: true
    });

    const volumeBar = blessed.progressbar({
      top: '45%',
      left: 'center',
      width: '80%',
      height: 3,
      label: ' Master Volume ',
      border: { type: 'line' },
      style: {
        bar: { bg: 'green' },
        border: { fg: 'green' }
      },
      filled: this.getVolume()
    });

    const menu = blessed.list({
      top: '52%',
      left: 'center',
      width: '60%',
      height: '35%',
      label: ' Actions ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        'Volume Up (+5%)',
        'Volume Down (-5%)',
        'Mute/Unmute',
        'Set Volume',
        'Switch Output Device',
        'Back'
      ]
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0:
          this.execCommand('wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+');
          volumeBar.setProgress(this.getVolume());
          break;
        case 1:
          this.execCommand('wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-');
          volumeBar.setProgress(this.getVolume());
          break;
        case 2:
          this.execCommand('wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle');
          break;
        case 3:
          this.setCustomVolume(volumeBar);
          break;
        case 4:
          this.switchAudioDevice();
          break;
        case 5:
          this.showMainMenu();
          break;
      }
      this.screen.render();
    });

    this.mainBox.append(title);
    this.mainBox.append(deviceList);
    this.mainBox.append(volumeBar);
    this.mainBox.append(menu);
    menu.focus();
    this.screen.render();
  }

  getAudioDevices() {
    const output = this.execCommand('wpctl status');
    return output || 'No audio devices found';
  }

  getVolume() {
    const output = this.execCommand('wpctl get-volume @DEFAULT_AUDIO_SINK@');
    const match = output.match(/([0-9.]+)/);
    return match ? Math.round(parseFloat(match[1]) * 100) : 0;
  }

  setCustomVolume(volumeBar) {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Set Volume '
    });

    prompt.input('Enter volume (0-100):', '', (err, value) => {
      if (value && !isNaN(value)) {
        const vol = Math.max(0, Math.min(100, parseInt(value)));
        this.execCommand(`wpctl set-volume @DEFAULT_AUDIO_SINK@ ${vol}%`);
        volumeBar.setProgress(vol);
        this.screen.render();
      }
    });

    this.screen.render();
  }

  switchAudioDevice() {
    const devices = this.execCommand('wpctl status | grep -A 20 "Audio" | grep -E "^.*[0-9]+\\."');
    
    const list = blessed.list({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '70%',
      height: '60%',
      border: { type: 'line' },
      label: ' Select Audio Device ',
      keys: true,
      vi: true,
      mouse: true,
      style: {
        selected: { bg: 'blue' }
      },
      items: devices.split('\n').filter(d => d.trim())
    });

    list.on('select', (item) => {
      const match = item.content.match(/(\d+)\./);
      if (match) {
        this.execCommand(`wpctl set-default ${match[1]}`);
      }
      list.destroy();
      this.screen.render();
    });

    list.focus();
    this.screen.render();
  }

  showWifiManagement() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}📡 WiFi Management{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const status = blessed.box({
      top: 4,
      left: 1,
      width: '98%',
      height: '30%',
      label: ' WiFi Status ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: this.getWifiStatus(),
      scrollable: true,
      tags: true
    });

    const networks = blessed.box({
      top: '35%',
      left: 1,
      width: '60%',
      height: '50%',
      label: ' Available Networks ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: 'Scanning...',
      scrollable: true,
      tags: true,
      mouse: true,
      keys: true
    });

    setTimeout(() => {
      networks.setContent(this.scanWifi());
      this.screen.render();
    }, 500);

    const menu = blessed.list({
      top: '35%',
      right: 1,
      width: '38%',
      height: '50%',
      label: ' Actions ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        'Scan Networks',
        'Connect to Network',
        'Disconnect',
        'Toggle WiFi',
        'Saved Connections',
        'Back'
      ]
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0:
          networks.setContent('Scanning...');
          this.screen.render();
          setTimeout(() => {
            networks.setContent(this.scanWifi());
            this.screen.render();
          }, 1000);
          break;
        case 1:
          this.connectWifi();
          break;
        case 2:
          this.execCommand('nmcli device disconnect wlan0');
          status.setContent(this.getWifiStatus());
          this.screen.render();
          break;
        case 3:
          this.execCommand('nmcli radio wifi toggle');
          status.setContent(this.getWifiStatus());
          this.screen.render();
          break;
        case 4:
          this.showSavedConnections();
          break;
        case 5:
          this.showMainMenu();
          break;
      }
    });

    this.mainBox.append(title);
    this.mainBox.append(status);
    this.mainBox.append(networks);
    this.mainBox.append(menu);
    menu.focus();
    this.screen.render();
  }

  getWifiStatus() {
    return this.execCommand('nmcli device status | grep wifi') || 'WiFi not available';
  }

  scanWifi() {
    const output = this.execCommand('nmcli device wifi list');
    return output || 'No networks found';
  }

  connectWifi() {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Connect to WiFi '
    });

    prompt.input('Enter SSID:', '', (err, ssid) => {
      if (ssid) {
        const promptPass = blessed.prompt({
          parent: this.screen,
          top: 'center',
          left: 'center',
          height: 'shrink',
          width: 'shrink',
          border: { type: 'line' },
          label: ' Password '
        });

        promptPass.input('Enter password:', '', (err, pass) => {
          if (pass) {
            const result = this.execCommand(`nmcli device wifi connect "${ssid}" password "${pass}"`);
            blessed.message({
              parent: this.screen,
              top: 'center',
              left: 'center',
              height: 'shrink',
              width: 'shrink',
              border: { type: 'line' },
              label: ' Result '
            }).display(result, 3, () => {
              this.screen.render();
            });
          }
        });

        this.screen.render();
      }
    });

    this.screen.render();
  }

  showSavedConnections() {
    const connections = this.execCommand('nmcli connection show');
    
    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      border: { type: 'line' },
      label: ' Saved Connections (ESC to close) ',
      content: connections,
      scrollable: true,
      keys: true,
      vi: true,
      mouse: true
    });

    box.key(['escape'], () => {
      box.destroy();
      this.screen.render();
    });

    box.focus();
    this.screen.render();
  }

  showBluetoothControl() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}🔵 Bluetooth Control{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const status = blessed.box({
      top: 4,
      left: 1,
      width: '98%',
      height: '30%',
      label: ' Bluetooth Status ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: this.getBluetoothStatus(),
      scrollable: true,
      tags: true
    });

    const devices = blessed.box({
      top: '35%',
      left: 1,
      width: '60%',
      height: '50%',
      label: ' Paired Devices ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: this.getBluetoothDevices(),
      scrollable: true,
      tags: true,
      mouse: true,
      keys: true
    });

    const menu = blessed.list({
      top: '35%',
      right: 1,
      width: '38%',
      height: '50%',
      label: ' Actions ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        'Toggle Bluetooth',
        'Scan Devices',
        'Pair Device',
        'Connect Device',
        'Disconnect Device',
        'Remove Device',
        'Back'
      ]
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0:
          this.execCommand('bluetoothctl power toggle');
          setTimeout(() => {
            status.setContent(this.getBluetoothStatus());
            this.screen.render();
          }, 500);
          break;
        case 1:
          devices.setContent('Scanning...');
          this.screen.render();
          this.execCommand('bluetoothctl scan on & sleep 5 && bluetoothctl scan off');
          setTimeout(() => {
            devices.setContent(this.getBluetoothDevices());
            this.screen.render();
          }, 5000);
          break;
        case 2:
          this.pairBluetoothDevice();
          break;
        case 3:
          this.connectBluetoothDevice();
          break;
        case 4:
          this.disconnectBluetoothDevice();
          break;
        case 5:
          this.removeBluetoothDevice();
          break;
        case 6:
          this.showMainMenu();
          break;
      }
    });

    this.mainBox.append(title);
    this.mainBox.append(status);
    this.mainBox.append(devices);
    this.mainBox.append(menu);
    menu.focus();
    this.screen.render();
  }

  getBluetoothStatus() {
    return this.execCommand('bluetoothctl show') || 'Bluetooth not available';
  }

  getBluetoothDevices() {
    return this.execCommand('bluetoothctl devices') || 'No devices found';
  }

  pairBluetoothDevice() {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Pair Device '
    });

    prompt.input('Enter device MAC address:', '', (err, mac) => {
      if (mac) {
        const result = this.execCommand(`bluetoothctl pair ${mac}`);
        blessed.message({
          parent: this.screen,
          top: 'center',
          left: 'center',
          height: 'shrink',
          width: 'shrink',
          border: { type: 'line' },
          label: ' Result '
        }).display(result, 3, () => {
          this.screen.render();
        });
      }
    });

    this.screen.render();
  }

  connectBluetoothDevice() {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Connect Device '
    });

    prompt.input('Enter device MAC address:', '', (err, mac) => {
      if (mac) {
        const result = this.execCommand(`bluetoothctl connect ${mac}`);
        blessed.message({
          parent: this.screen,
          top: 'center',
          left: 'center',
          height: 'shrink',
          width: 'shrink',
          border: { type: 'line' },
          label: ' Result '
        }).display(result, 3, () => {
          this.screen.render();
        });
      }
    });

    this.screen.render();
  }

  disconnectBluetoothDevice() {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Disconnect Device '
    });

    prompt.input('Enter device MAC address:', '', (err, mac) => {
      if (mac) {
        const result = this.execCommand(`bluetoothctl disconnect ${mac}`);
        blessed.message({
          parent: this.screen,
          top: 'center',
          left: 'center',
          height: 'shrink',
          width: 'shrink',
          border: { type: 'line' },
          label: ' Result '
        }).display(result, 3);
      }
    });

    this.screen.render();
  }

  removeBluetoothDevice() {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Remove Device '
    });

    prompt.input('Enter device MAC address:', '', (err, mac) => {
      if (mac) {
        const result = this.execCommand(`bluetoothctl remove ${mac}`);
        blessed.message({
          parent: this.screen,
          top: 'center',
          left: 'center',
          height: 'shrink',
          width: 'shrink',
          border: { type: 'line' },
          label: ' Result '
        }).display(result, 3);
      }
    });

    this.screen.render();
  }

  showUserManagement() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}👥 User Management{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const userList = blessed.box({
      top: 4,
      left: 1,
      width: '60%',
      height: '70%',
      label: ' System Users ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: this.getUsers(),
      scrollable: true,
      tags: true,
      mouse: true,
      keys: true
    });

    const menu = blessed.list({
      top: 4,
      right: 1,
      width: '38%',
      height: '70%',
      label: ' Actions ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        'View Current User',
        'List All Users',
        'View User Groups',
        'View Logged In Users',
        'Back'
      ]
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0:
          userList.setContent(this.execCommand('whoami && id'));
          break;
        case 1:
          userList.setContent(this.getUsers());
          break;
        case 2:
          userList.setContent(this.execCommand('groups'));
          break;
        case 3:
          userList.setContent(this.execCommand('w'));
          break;
        case 4:
          this.showMainMenu();
          break;
      }
      this.screen.render();
    });

    this.mainBox.append(title);
    this.mainBox.append(userList);
    this.mainBox.append(menu);
    menu.focus();
    this.screen.render();
  }

  getUsers() {
    return this.execCommand('cat /etc/passwd | grep -v nologin | grep -v "false" | cut -d: -f1,3,4,6');
  }

  showSystemInfo() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}⚙️  System Information{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const info = blessed.box({
      top: 4,
      left: 1,
      width: '98%',
      height: '80%',
      label: ' System Info ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: this.getSystemInfo(),
      scrollable: true,
      tags: true,
      mouse: true,
      keys: true
    });

    info.key(['escape', 'q'], () => {
      this.showMainMenu();
    });

    this.mainBox.append(title);
    this.mainBox.append(info);
    info.focus();
    this.screen.render();
  }

  getSystemInfo() {
    const info = `
{bold}Hostname:{/bold} ${this.execCommand('hostname')}
{bold}Kernel:{/bold} ${this.execCommand('uname -r')}
{bold}OS:{/bold} ${this.execCommand('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2').replace(/"/g, '')}
{bold}Uptime:{/bold} ${this.execCommand('uptime -p')}
{bold}CPU:{/bold} ${this.execCommand('lscpu | grep "Model name" | cut -d: -f2').trim()}
{bold}Memory:{/bold} ${this.execCommand('free -h | grep Mem | awk \'{print $3 " / " $2}\'')}
{bold}Disk Usage:{/bold}
${this.execCommand('df -h | grep -E "^/dev"')}

{bold}Hyprland Version:{/bold} ${this.execCommand('hyprctl version | head -1')}
    `;
    return info;
  }

  showHyprlandConfig() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}🎨 Hyprland Configuration{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const config = blessed.box({
      top: 4,
      left: 1,
      width: '60%',
      height: '80%',
      label: ' Current Config ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      content: this.getHyprlandConfig(),
      scrollable: true,
      tags: true,
      mouse: true,
      keys: true
    });

    const menu = blessed.list({
      top: 4,
      right: 1,
      width: '38%',
      height: '80%',
      label: ' Actions ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        'View Config',
        'View Keybinds',
        'View Variables',
        'Reload Config',
        'Edit Config (default editor)',
        'Back'
      ]
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0:
          config.setContent(this.getHyprlandConfig());
          break;
        case 1:
          config.setContent(this.execCommand('hyprctl binds'));
          break;
        case 2:
          config.setContent(this.execCommand('hyprctl getoption -j all'));
          break;
        case 3:
          const result = this.execCommand('hyprctl reload');
          blessed.message({
            parent: this.screen,
            top: 'center',
            left: 'center',
            height: 'shrink',
            width: 'shrink',
            border: { type: 'line' },
            label: ' Result '
          }).display('Config reloaded!', 2);
          break;
        case 4:
          this.execCommand('${EDITOR:-nano} ~/.config/hypr/hyprland.conf');
          break;
        case 5:
          this.showMainMenu();
          break;
      }
      this.screen.render();
    });

    this.mainBox.append(title);
    this.mainBox.append(config);
    this.mainBox.append(menu);
    menu.focus();
    this.screen.render();
  }

  getHyprlandConfig() {
    try {
      const config = fs.readFileSync(`${process.env.HOME}/.config/hypr/hyprland.conf`, 'utf8');
      return config;
    } catch {
      return 'Config file not found';
    }
  }

  showPowerManagement() {
    this.mainBox.children.forEach(child => child.destroy());

    const title = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 3,
      content: '{center}{bold}🔋 Power Management{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } }
    });

    const menu = blessed.list({
      top: 'center',
      left: 'center',
      width: '60%',
      height: '60%',
      label: ' Power Options ',
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        border: { fg: 'green' }
      },
      items: [
        '💤 Suspend',
        '🔄 Reboot',
        '⚡ Shutdown',
        '🔒 Lock Screen',
        '🚪 Logout',
        '⬅️  Back'
      ]
    });

    menu.on('select', (item, index) => {
      switch(index) {
        case 0:
          this.confirmAction('Suspend the system?', () => {
            this.execCommand('systemctl suspend');
          });
          break;
        case 1:
          this.confirmAction('Reboot the system?', () => {
            this.execCommand('systemctl reboot');
          });
          break;
        case 2:
          this.confirmAction('Shutdown the system?', () => {
            this.execCommand('systemctl poweroff');
          });
          break;
        case 3:
          this.execCommand('hyprlock');
          break;
        case 4:
          this.confirmAction('Logout from Hyprland?', () => {
            this.execCommand('hyprctl dispatch exit');
          });
          break;
        case 5:
          this.showMainMenu();
          break;
      }
    });

    this.mainBox.append(title);
    this.mainBox.append(menu);
    menu.focus();
    this.screen.render();
  }

  confirmAction(message, callback) {
    const question = blessed.question({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: { type: 'line' },
      label: ' Confirm '
    });

    question.ask(message, (err, value) => {
      if (value) {
        callback();
      }
    });

    this.screen.render();
  }
}

// Start the application
const app = new HyprControl();
