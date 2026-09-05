import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('Johan Marketplace runtime error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-state">
          <h1>Website gagal dimuat</h1>
          <p>Terjadi error aplikasi. Coba refresh halaman.</p>
          <button className="button primary" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}
