import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PageHeader', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders title correctly', () => {
    render(
      <BrowserRouter>
        <PageHeader title="Test Title" />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders back button when backPath is provided', () => {
    render(
      <BrowserRouter>
        <PageHeader title="Test Title" backPath="/test" />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not render back button when backPath is not provided', () => {
    render(
      <BrowserRouter>
        <PageHeader title="Test Title" />
      </BrowserRouter>
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls navigate when back button is clicked', () => {
    render(
      <BrowserRouter>
        <PageHeader title="Test Title" backPath="/test" />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/test');
  });

  it('calls onBack callback when provided', () => {
    const onBackMock = jest.fn();
    
    render(
      <BrowserRouter>
        <PageHeader title="Test Title" onBack={onBackMock} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onBackMock).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders actions when provided', () => {
    const actions = <button>Test Action</button>;
    
    render(
      <BrowserRouter>
        <PageHeader title="Test Title" actions={actions} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });
});