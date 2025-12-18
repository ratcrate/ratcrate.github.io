// src/components/CliTuiPage.jsx (Image Size Fix)
import React from 'react';

// Helper to render installation instructions
const InstallSection = ({ title, commands }) => (
    <div className="mt-4">
        <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
        <div className="bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-200 overflow-x-auto whitespace-nowrap">
            {commands.map((cmd, index) => (
                <code key={index} className="block select-all mb-1">{cmd}</code>
            ))}
        </div>
    </div>
);

// Main component for each project section
const ProjectFeature = ({ title, description, cliCommand, installCommands, imageUrl, reverse }) => (
    // Increased gap (8->12) and vertical padding (10->16) for better visual separation
    <div className={`flex flex-col md:flex-row items-center gap-12 py-16 border-b border-gray-800 ${reverse ? 'md:flex-row-reverse' : ''}`}>
        
        {/* Left/Right Column: Code and Description */}
        <div className="w-full md:w-1/2">
            <h3 className="text-3xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 mb-4 text-lg">{description}</p>
            
            {/* Quick run command */}
            {cliCommand && (
                <div className="bg-blue-900/50 p-3 rounded-md text-sm font-mono text-blue-300 mb-6">
                    Run command: <code className="select-all">{cliCommand}</code>
                </div>
            )}
            
            {/* Installation */}
            <InstallSection title="Installation via Homebrew or Cargo" commands={installCommands} />
        </div>

        {/* Right/Left Column: Visual Demo (GIF) */}
        <div className="w-full md:w-1/2 text-center">
            {/* Added max-w-2xl (max width extra-extra-large) to force the GIF to scale up */}
            <div className="rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl max-w-2xl mx-auto"> 
                {imageUrl}
            </div>
        </div>
    </div>
);


const CliTuiPage = () => {
  const cliInstall = [
    "# macOS/Linux (Homebrew)",
    "brew tap rvbug/tap",
    "brew install ratcrate-cli",
    "",
    "# Any platform (Cargo)",
    "cargo install ratcrate-cli",
  ];
  
//   const tuiInstall = [
//     "# macOS/Linux (Homebrew)",
//     "brew tap ratcrate/tap",
//     "brew install ratcrate-tui",
//     "",
//     "# Any platform (Cargo)",
//     "cargo install ratcrate-tui",
//   ];

  const tuiInstall = [
    "Releasing on 23rd Dec'25!",
  ];

  return (
    // Added max-w-7xl to make the entire content area wider
    <section id="tools-page" className="container mx-auto px-4 py-12 max-w-7xl"> 
      <header className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Ecosystem CLI and TUI Tools</h2>
        <p className="text-lg text-gray-400 max-w-4xl mx-auto">
          Two companion tools built with Ratatui to bring the package exploration experience directly to your terminal.
        </p>
      </header>

      <div className="space-y-12">        
        {/* Project 1: ratcrate-cli */}
        <ProjectFeature
            title="ratcrate-cli - The Quick Lookup CLI Tool"
            description="A lightweight, fast, CLI to search, view any Ratatui-based crates without leaving your terminal."
            cliCommand="ratcrate-cli search <crate-name>"
            installCommands={cliInstall}
            imageUrl={
                <img
                    src="./assets/ratcrate-cli.gif"
                    alt="Demonstration of ratcrate-cli search and detail output"
                    className="w-full h-auto"
                />
            }
            reverse={false}
        />
        {/* Project 2: ratcrate-tui */}
        <ProjectFeature
            title="ratcrate-tui - Ratatui Terminal UI"
            description="The full-featured Terminal UI, built using Ratatui. Offers an interactive, visual, and keyboard-driven Ratatui-based crates search."
            cliCommand="ratcrate-tui"
            installCommands={tuiInstall}
            imageUrl={
                <img
                    src="./assets/ratcrate-tui.gif"
                    alt="Demonstration of ratcrate-tui interactive browsing interface"
                    className="w-full h-auto"
                />
            }
            reverse={true}
        />

      </div>
      
      <div className="text-center mt-12 pt-6 text-gray-500 text-sm">
          Both tools are open-source and contribute to the Ratatui ecosystem.
      </div>
    </section>
  );
};

export default CliTuiPage;