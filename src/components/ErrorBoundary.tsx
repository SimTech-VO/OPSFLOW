import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas p-6 text-center">
          <AlertTriangle size={56} className="mb-4 text-danger" />
          <h1 className="mb-2 text-2xl font-semibold text-fg">Une erreur est survenue</h1>
          <p className="mb-8 max-w-md text-fg-muted">L'application a rencontré un problème inattendu. Vos données ont été préservées.</p>
          <Button
            variant="primary"
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            Réinitialiser l'App
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
