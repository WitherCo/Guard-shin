import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
  useToast,
  Card,
  CardBody,
  Flex,
  Badge
} from '@chakra-ui/react';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const PaymentSuccess = () => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      // Get payment intent ID from URL
      const params = new URLSearchParams(location.search);
      const paymentIntentId = params.get('payment_intent');
      const redirectStatus = params.get('redirect_status');

      if (!paymentIntentId || redirectStatus !== 'succeeded') {
        toast({
          title: "Payment verification failed",
          description: "We couldn't verify your payment. Please contact support if you believe this is an error.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      try {
        // Verify payment status with the server
        const response = await fetch(`/api/verify-payment?payment_intent=${paymentIntentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        const data = await response.json();
        setPaymentDetails(data);
        
        toast({
          title: "Payment successful!",
          description: "Thank you for your purchase! Your premium features are now active.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Error verifying payment",
          description: "There was an issue verifying your payment. Please contact support.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [location, toast]);

  const getPremiumTypeName = (premiumType) => {
    switch (premiumType) {
      case 'regular':
        return 'Premium';
      case 'plus':
        return 'Premium+';
      case 'lifetime_regular':
        return 'Lifetime Premium';
      case 'lifetime_plus':
        return 'Lifetime Premium+';
      default:
        return 'Premium';
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Icon as={FiCheckCircle} w={20} h={20} color="green.500" />
        
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>Payment Successful!</Heading>
          <Text color="gray.500" fontSize="lg">
            Thank you for upgrading to Guard-shin Premium
          </Text>
        </Box>

        {!isLoading && paymentDetails && (
          <Card variant="outline" width="100%">
            <CardBody>
              <VStack spacing={5} align="stretch">
                <Flex justify="space-between">
                  <Text fontWeight="bold">Subscription</Text>
                  <Badge colorScheme="purple" fontSize="md" py={1} px={2}>
                    {getPremiumTypeName(paymentDetails.premiumType)}
                  </Badge>
                </Flex>
                
                {paymentDetails.expiresAt && (
                  <Flex justify="space-between">
                    <Text>Valid until</Text>
                    <Text>{new Date(paymentDetails.expiresAt).toLocaleDateString()}</Text>
                  </Flex>
                )}
                
                <Flex justify="space-between">
                  <Text>Status</Text>
                  <Badge colorScheme="green">Active</Badge>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Box textAlign="center" mt={8}>
          <Text mb={4}>
            Your premium features are now active! You can start using them right away in your Discord servers.
          </Text>
          
          <VStack spacing={4}>
            <Button 
              colorScheme="purple" 
              size="lg" 
              rightIcon={<FiArrowRight />}
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('https://discord.gg/g3rFbaW6gw', '_blank')}
            >
              Join Our Support Server
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default PaymentSuccess;