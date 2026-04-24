import React from 'react';

const AIResponseDisplay = ({ response, loading, onClose, title }) => {
  if (!response && !loading) return null;

  const highlightValues = (str) => {
    const parts = str.split(/(\d+\.?\d*%|\$[\d,]+\.?\d*|\d+\.?\d*\s*(?:kg|g|mg|L|mL|ppm|°C|°F|cm|mm|m))/g);
    return parts.map((part, i) => {
      if (/^\d+\.?\d*%$|^\$[\d,]+\.?\d*$|^\d+\.?\d*\s*(?:kg|g|mg|L|mL|ppm|°C|°F|cm|mm|m)$/.test(part)) {
        return <span key={i} style={{ color: '#0077B6', fontWeight: 600 }}>{part}</span>;
      }
      const boldParts = part.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        return boldParts.map((bp, j) => (
          j % 2 === 1 ? <strong key={`${i}-${j}`}>{bp}</strong> : bp
        ));
      }
      return part;
    });
  };

  const formatResponse = (text) => {
    if (!text) return null;
    if (typeof text === 'object') text = JSON.stringify(text, null, 2);
    if (typeof text !== 'string') text = String(text);

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`}>
            {listItems.map((item, i) => <li key={i}>{highlightValues(item)}</li>)}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) { flushList(); return; }

      if (/^#{1,3}\s/.test(trimmed)) {
        flushList();
        const level = trimmed.match(/^(#+)/)[1].length;
        const text = trimmed.replace(/^#+\s*/, '');
        const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
        elements.push(<Tag key={index}>{text}</Tag>);
        return;
      }

      if (/^[A-Z][A-Z\s&]+:?\s*$/.test(trimmed) || /^[A-Z][\w\s]+:$/.test(trimmed)) {
        flushList();
        elements.push(<h4 key={index}>{trimmed.replace(/:$/, '')}</h4>);
        return;
      }

      if (/^[-*•]\s/.test(trimmed)) {
        listItems.push(trimmed.replace(/^[-*•]\s*/, ''));
        return;
      }

      if (/^\d+[.)]\s/.test(trimmed)) {
        listItems.push(trimmed.replace(/^\d+[.)]\s*/, ''));
        return;
      }

      if (/^[-=_]{3,}$/.test(trimmed)) {
        flushList();
        elements.push(<hr key={index} />);
        return;
      }

      flushList();
      elements.push(<p key={index}>{highlightValues(trimmed)}</p>);
    });

    flushList();
    return elements;
  };

  return (
    <div className="ai-response-card">
      <div className="ai-response-inner">
        <div className="ai-response-header">
          <div className="ai-icon">🤖</div>
          <div>
            <h3>{title || 'AI Analysis'}</h3>
            <p>Powered by Claude AI via OpenRouter</p>
          </div>
          <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span className="loading-text">AI is analyzing your data...</span>
          </div>
        ) : (
          <div className="ai-response-body">
            {formatResponse(response)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIResponseDisplay;
