import React, { useState } from 'react';

interface LoginProps {
  onConnect: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onConnect }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    const name = username.trim();
    if (!name) {
      setError('Please enter a name');
      return;
    }
    setError('');
    onConnect(name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div className="login">
      <div className="login-box">
        <h2>Enter Your Name</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Your name"
        />
        <button onClick={handleConnect}>Join Chat</button>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
