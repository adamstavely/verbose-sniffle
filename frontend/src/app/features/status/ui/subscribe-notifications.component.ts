import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscribe-notifications',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subscribe-notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscribeNotificationsComponent {
  readonly email = signal('');
  readonly submitted = signal(false);

  onSubmit() {
    this.submitted.set(true);
    // TODO: wire to backend subscribe API
  }
}
