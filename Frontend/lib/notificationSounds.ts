"use client";

export type SoundTheme = "classic" | "soft" | "modern";

export class NotificationSoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
  }

  private async initAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async playNotificationSound(
    theme: SoundTheme = "classic",
    volume: number = 0.7
  ) {
    if (!this.audioContext) return;

    await this.initAudioContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    switch (theme) {
      case "classic":
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          600,
          this.audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.3
        );
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
        break;

      case "soft":
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          600,
          this.audioContext.currentTime + 0.4
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.4
        );
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
        break;

      case "modern":
        oscillator.frequency.setValueAtTime(
          1000,
          this.audioContext.currentTime
        );
        oscillator.frequency.setValueAtTime(
          1200,
          this.audioContext.currentTime + 0.05
        );
        oscillator.frequency.setValueAtTime(
          800,
          this.audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.2
        );
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        break;
    }
  }
}

export const notificationSoundGenerator = new NotificationSoundGenerator();

export async function playNotificationSound(
  theme: SoundTheme = "classic",
  volume: number = 0.7
) {
  await notificationSoundGenerator.playNotificationSound(theme, volume);
}

export async function testNotificationSounds() {
  const themes: SoundTheme[] = ["classic", "soft", "modern"];

  for (const theme of themes) {
    await notificationSoundGenerator.playNotificationSound(theme, 0.5);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
