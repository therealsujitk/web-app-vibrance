import { RedocStandalone } from 'redoc';
import VERSION_1_0 from './openapi/v1.0.json';

function App() {
  return (
    <RedocStandalone 
      spec={VERSION_1_0} 
      options={{
        nativeScrollbars: true,
        theme: { 
          colors: { primary: { main: '#dd5522' } },
          logo: {
            gutter: '20px',
            maxWidth: '80%'
          }
        },
      }}
    />
  );
}

export default App;
