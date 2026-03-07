import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActiveIncidentsComponent } from './active-incidents.component';

describe('ActiveIncidentsComponent', () => {
  let component: ActiveIncidentsComponent;
  let fixture: ComponentFixture<ActiveIncidentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveIncidentsComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveIncidentsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('incidents', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter out resolved incidents', () => {
    fixture.componentRef.setInput('incidents', [
      {
        id: '1',
        title: 'Active',
        level: 'OUTAGE',
        startedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Resolved',
        level: 'HEALTHY',
        startedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      },
    ]);
    fixture.detectChanges();
    expect(component.activeIncidents().length).toBe(1);
    expect(component.activeIncidents()[0].title).toBe('Active');
  });
});
