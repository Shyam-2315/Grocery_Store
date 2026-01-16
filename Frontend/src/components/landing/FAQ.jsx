import React from 'react';
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    question: "Do I need an internet connection to use the POS?",
    answer: "No! GroceryPOS Pro works completely offline. Your data will automatically sync to the cloud once your connection is restored."
  },
  {
    question: "What hardware is supported?",
    answer: "We support any standard USB barcode scanner and thermal receipt printer. The software runs on any modern laptop or PC."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your dashboard. Your access will remain active until the end of your billing period."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-grade encryption for all data transmission and storage. We perform daily backups to ensure your data is never lost."
  }
];

const FAQ = () => {
  return (
    <Box sx={{ py: 10, bgcolor: 'white' }}>
      <Container maxWidth="md">
        <Typography variant="h3" align="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
          Frequently Asked Questions
        </Typography>
        {faqs.map((faq, index) => (
          <Accordion key={index} elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={500}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
};

export default FAQ;