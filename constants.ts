
export const SYSTEM_INSTRUCTION = `
You are the "RadSafe AI Forensic Scientist." Your mission is to assist users in Bihar with the detection of Uranium in groundwater using their smartphone camera sensors.

EXPERT CAPABILITIES:
1. **CMOS Scintillation Analysis**: In dark settings (lens covered), identify "white hits" or "pixel streaks" caused by alpha/beta/gamma particles. Reference the 2021 Nature Scientific Reports study.
2. **Uranium Fluorescence**: Detect neon-green glow (500-550nm) under UV light. Reference Uranyl ion behavior.
3. **Simulation Literacy**: The app has a "Simulation Mode." 
   - "GAMMA": Interpret standard scintillation hits as high-energy particle tracks.
   - "ALPHA": Recognize thick, long tracks as heavy nucleus decay.
   - "BETA": Recognize thin, jagged streaks as electron/positron emission.
   - "RADON": Recognize scattered, flickering noise as atmospheric noble gas decay.
   - "URANIUM GLOW": Treat the green overlay as a positive marker for Uranyl ion contamination.

CONSULTATION PROTOCOL:
- Speak in the user's language (Bhojpuri, Hindi, English).
- Reference Kumar et al. (Nature Scientific Reports, 2025) - Uranium in breastmilk/groundwater in 6 Bihar districts.
- Provide a clear forensic report for every capture or analysis.
- Explain that 70% of infants are at risk of kidney issues in these zones.

RESEARCH BACKING:
- Kumar et al. (Scientific Reports, 2025): https://www.nature.com/articles/s41598-025-25307-7
- Scientific Reports (2021): https://www.nature.com/articles/s41598-021-92195-y
- Sciencedirect (2016): https://www.sciencedirect.com/science/article/abs/pii/S016890021630167X
- Arxiv (2014): https://arxiv.org/abs/1401.0766
- PubMed (2015): https://pubmed.ncbi.nlm.nih.gov/26041476/
`;

export const RESEARCH_PAPERS = [
  {
    title: "Uranium in breastmilk and groundwater (Bihar 2025)",
    journal: "Nature Scientific Reports",
    link: "https://www.nature.com/articles/s41598-025-25307-7",
    description: "Uranium found in 100% of samples in 6 Bihar districts. Katihar recorded highest levels. Urgent monitoring required."
  },
  {
    title: "Suitability of smartphone sensors for radiation (2021)",
    journal: "Scientific Reports",
    link: "https://www.nature.com/articles/s41598-021-92195-y",
    description: "Proves CMOS sensors detect ionizing radiation (gamma/X-rays) when light is blocked. Core technology for RadSafe."
  },
  {
    title: "Gamma Detection using Cellphone CMOS (2014)",
    journal: "arXiv / Cornell University",
    link: "https://arxiv.org/abs/1401.0766",
    description: "Early proof that gamma rays create detectable spots and lines on smartphone sensor hardware."
  },
  {
    title: "Medical radiation detection using CMOS (2016)",
    journal: "Nuclear Instruments and Methods",
    link: "https://www.sciencedirect.com/science/article/abs/pii/S016890021630167X",
    description: "Detected high-energy gamma rays (Cs-137) using standard smartphone sensors."
  },
  {
    title: "Radiation dosimetry properties of CMOS (2015)",
    journal: "Radiation Protection Dosimetry",
    link: "https://pubmed.ncbi.nlm.nih.gov/26041476/",
    description: "Verified the radiological response of CMOS sensors for practical dosimetry applications."
  }
];

export const DISTRICTS = [
  { id: 'supaul', name: 'Supaul', lat: 26.1260, lng: 86.6033, risk: 0.92, color: '#ef4444' },
  { id: 'katihar', name: 'Katihar', lat: 25.5518, lng: 87.5721, risk: 0.96, color: '#ef4444' },
  { id: 'nalanda', name: 'Nalanda', lat: 25.1328, lng: 85.5034, risk: 0.78, color: '#f59e0b' },
  { id: 'gopalganj', name: 'Gopalganj', lat: 26.4674, lng: 84.4379, risk: 0.70, color: '#f59e0b' },
  { id: 'khagaria', name: 'Khagaria', lat: 25.5078, lng: 86.4716, risk: 0.85, color: '#ef4444' }
];

export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2026&auto=format&fit=crop",
  lab: "https://images.unsplash.com/photo-1579154273821-b3c14f92d11f?q=80&w=2070&auto=format&fit=crop"
};

export const AUDIO_SAMPLE_RATE_INPUT = 16000;
export const AUDIO_SAMPLE_RATE_OUTPUT = 24000;
export const VIDEO_FRAME_RATE = 5;
